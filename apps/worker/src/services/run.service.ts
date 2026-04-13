import { agentRuns, eq, createClient } from '@repo/database';
import { resolveCredential, resolveGoogleToken, resolveDefaultCredential } from '../credentialResolver.js';
import { deductCredits } from '../credit-manager.js';
import { WORKER_NODES } from '../nodes/index.js';
import { ToolContext, NODE_REGISTRY } from '@repo/nodes';
import { renderTemplate } from '../engine/template-renderer.js';
import { resolveStartNodes, buildReachableSubgraph, calculateActiveInDegree } from '../engine/flow-engine.js';

const db = createClient(process.env.POSTGRES_URL!);

function sanitize(input: any): any {
  if (!input) return input;
  if (typeof input !== 'string') {
    try {
      const str = JSON.stringify(input);
      return JSON.parse(str.replace(/:[^:@/]+@/g, ':****@'));
    } catch { return '[Circular or Non-Serializable Object]'; }
  }
  return input.replace(/:[^:@/]+@/g, ':****@');
}

export async function executeRun(job: any) {
  const { runId, workflow } = job.data;
  console.log(`[Worker] Starting Agent Run: ${runId}`);

  const logs: any[] = [];
  try {
    await db.update(agentRuns).set({ status: 'running', startTime: new Date() }).where(eq(agentRuns.id, runId));

    const { nodes = [], edges = [], model = 'google/gemini-2.0-flash-001' } = workflow;

    // Credit Check
    const COST_PER_RUN = 5;
    const creditResult = await deductCredits(job.data.userId, COST_PER_RUN, `Agent Run: ${workflow.name || 'Untitled'}`);
    if (!creditResult.success) {
      await db.update(agentRuns).set({ 
        status: 'failed', endTime: new Date(),
        logs: [{ nodeId: 'billing', label: 'Billing Check', status: 'failed', error: creditResult.error, time: new Date() }] 
      }).where(eq(agentRuns.id, runId));
      return;
    }

    const ctx: Record<string, any> = {
      objective: workflow.description ?? 'Initializing.',
      workflow:  { name: workflow.name, model },
      nodes:     {},
      ids:       {}
    };

    const nodeMap = new Map<string, any>(nodes.map((n: any) => [n.id, n]));
    const executionCounts = new Map<string, number>();
    const pendingInputs = new Map<string, Record<string, any>>();
    
    const startNodes = resolveStartNodes(nodes, edges, job.data.triggerNodeId);
    const reachableIds = buildReachableSubgraph(startNodes, edges);
    const inDegree = calculateActiveInDegree(reachableIds, edges);

    const queue: string[] = startNodes.map((n: any) => {
      pendingInputs.set(n.id, { ...(job.data.inputData || {}) });
      return n.id;
    });

    let hasFailed = false;
    let failureReason = '';
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const incomingData = pendingInputs.get(nodeId) || {};
      
      const count = (executionCounts.get(nodeId) ?? 0);
      if (count > 100) continue;
      executionCounts.set(nodeId, count + 1);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const nodeLabel = node.data?.label ?? 'Node';
      const execKey = node.data?.executionKey ?? '';
      const config = (node.data?.config ?? {}) as Record<string, string>;

      const logStatus = async (id: string, st: any, result?: any) => {
        const existing = logs.find(l => l.nodeId === id);
        if (existing) {
          existing.status = st;
          if (result) existing.result = result;
        } else {
          logs.push({ nodeId: id, label: nodeMap.get(id)?.data?.label || 'Node', status: st, result, time: new Date() });
        }
        await db.update(agentRuns).set({ logs }).where(eq(agentRuns.id, runId));
      };

      await logStatus(nodeId, 'executing');

      try {
        const localCtx = { 
          ...incomingData, incoming: incomingData, input: incomingData,
          workflow: ctx.workflow, objective: ctx.objective, nodes: ctx.nodes, ids: ctx.ids
        };

        const render = (str: string) => renderTemplate(str, localCtx);
        let nodeResult: any = {};
        let activeHandle: string | null = null;

        const outgoingEdgesCheck = edges.filter((e: any) => e.source === nodeId);
        const isAgenticToolNode = outgoingEdgesCheck.length > 0 && outgoingEdgesCheck.every((e: any) => (e.targetHandle || '').toLowerCase().startsWith('tool'));

        if (isAgenticToolNode) {
          const nodeDef = NODE_REGISTRY.find(n => n.executionKey === execKey);
          nodeResult = { __toolDefinition: true, nodeId, executionKey: execKey, label: nodeLabel, config };
        } else {
          const handler = WORKER_NODES[execKey];
          if (handler) {
            let creds: any = null;
            const isPipedream = execKey === 'pipedream_action' || execKey.includes('pipedream');

            if (config.credentialId) {
              if (isPipedream) {
                // Pipedream credentials are managed externally; skip DB UUID lookup
                creds = { accountId: config.credentialId };
              } else {
                const res = await resolveCredential(config.credentialId, job.data.userId);
                creds = res.data;
                if (execKey.startsWith('google_')) {
                  creds.accessToken = await resolveGoogleToken(config.credentialId, job.data.userId);
                }
              }
            } else {
               const nodeDef = NODE_REGISTRY.find(n => n.executionKey === execKey);
               if (nodeDef?.credentialTypes?.length) {
                 const res = await resolveDefaultCredential(nodeDef.credentialTypes, job.data.userId);
                 if (res) {
                    creds = res.data;
                    if (execKey.startsWith('google_')) creds.accessToken = await resolveGoogleToken(res.id, job.data.userId);
                 }
               }
            }

            const toolContext: ToolContext = {
              config, incomingData, ctx, job, userId: job.data.userId, credentials: creds, render,
              logNodeStatus: logStatus, nodeId, execKey, label: nodeLabel, handlers: WORKER_NODES,
              resolveCredential, resolveDefaultCredential
            };
            nodeResult = await handler(toolContext);
            activeHandle = nodeResult?._activeHandle || null;
          }
        }

        let enrichedResult = nodeResult;
        ctx.ids[nodeId] = enrichedResult;
        ctx.nodes[nodeLabel] = enrichedResult;
        await logStatus(nodeId, enrichedResult?.__toolDefinition ? 'pending' : 'completed', enrichedResult);

        const isFailedNode = nodeResult?.failed || !!nodeResult?.error;
        if (isFailedNode && !nodeResult?.__toolDefinition) {
          hasFailed = true;
          failureReason = nodeResult.error || 'Failed';
          break;
        }

        const outgoingEdges = edges.filter((e: any) => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (activeHandle && edge.sourceHandle && edge.sourceHandle !== activeHandle) continue;
          
          const targetId = edge.target;
          const targetHandle = edge.targetHandle || 'default';
          const existingInput = pendingInputs.get(targetId) || {};
          
          pendingInputs.set(targetId, {
            ...incomingData, ...existingInput,
            ...enrichedResult,
            [nodeLabel]: enrichedResult,
            [edge.source]: enrichedResult,
            [`@port:${targetHandle}`]: enrichedResult
          });

          const currentInDeg = inDegree.get(targetId) || 0;
          if (currentInDeg > 1) inDegree.set(targetId, currentInDeg - 1);
          else {
            inDegree.set(targetId, 0);
            if (!queue.includes(targetId)) queue.push(targetId);
          }
        }
      } catch (err: any) {
         await logStatus(nodeId, 'failed', { error: err.message });
         throw err;
      }
    }

    await db.update(agentRuns).set({
      status: hasFailed ? 'failed' : 'completed',
      endTime: new Date(),
      output: hasFailed ? { error: failureReason } : { result: ctx.report || ctx.result || 'Success' }
    }).where(eq(agentRuns.id, runId));

  } catch (err: any) {
    await db.update(agentRuns).set({ status: 'failed', endTime: new Date() }).where(eq(agentRuns.id, runId));
    throw err;
  }
}
