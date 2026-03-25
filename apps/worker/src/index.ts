import * as dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { getRedisConnection, AGENT_EXECUTION_QUEUE } from '@repo/queue';
import { createClient, agentRuns, eq } from '@repo/database';
import { resolveCredential, resolveGoogleToken, resolveDefaultCredential } from './credentialResolver.js';
import { deductCredits } from './credit-manager.js';
import { WORKER_NODES } from './nodes/index.js';
import { ToolContext, NODE_REGISTRY } from '@repo/nodes';

dotenv.config({ path: '../../.env' });

const db    = createClient(process.env.POSTGRES_URL!);
const redis = getRedisConnection();

console.log('Worker service starting… Listening for Autonomous sequences.');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Render {{ variable }} template strings against a context object with deep support */
function renderTemplate(str: string, ctx: Record<string, any>): string {
  if (!str || typeof str !== 'string') return str ?? '';
  
  // Support both {{ var }} and { var }
  return str.replace(/\{\{\s*([\s\S]+?)\s*\}\}|\{\s*([\s\S]+?)\s*\}/g, (_, doubleMatch, singleMatch) => {
    try {
      const fieldPath = (doubleMatch || singleMatch).trim();
      
      // 1. Pre-process handles
      let normalizedPath = fieldPath;
      
      // Support {{ $json.field }} -> {{ incoming.field }}
      // Support { input.field } -> { incoming.field }
      if (normalizedPath.startsWith('$json.')) {
        normalizedPath = normalizedPath.replace('$json.', 'incoming.');
      }
      if (normalizedPath.startsWith('input.')) {
        normalizedPath = normalizedPath.replace('input.', 'incoming.');
      }
      
      // Support {{ $node["Label"].json.field }} -> {{ nodes["Label"].field }}
      normalizedPath = normalizedPath.replace(/^\$node\["(.+?)"\]\.json\./, 'nodes["$1"].');
      
      // Support {{ $node.Label.json.field }} -> {{ nodes.Label.field }}
      normalizedPath = normalizedPath.replace(/^\$node\.(.+?)\.json\./, 'nodes.$1.');

      // 2. Resolve path
      const parts = normalizedPath.split(/\.|\['|'\]|\["|"\]/).filter(Boolean);
      let val: any = ctx;
      
      for (const part of parts) {
        if (val === null || val === undefined) break;
        val = val[part];
      }

      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    } catch (e) {
      console.warn(`[Template] Error rendering path:`, e);
      return '';
    }
  });
}

/** Try to parse a JSON string, fallback to return as-is */
function tryParseJson(str: string): any {
  try { return JSON.parse(str); } catch { return str; }
}

/** Resolve execution order following edges (topological BFS) */
function resolveExecutionOrder(nodes: any[], edges: any[]): any[] {
  // Find starting node (trigger / first node with no incoming edges)
  const hasIncoming = new Set(edges.map((e: any) => e.target));
  const start = nodes.find((n: any) =>
    n.data?.isTrigger || n.data?.executionKey === 'start' || !hasIncoming.has(n.id)
  ) ?? nodes[0];

  if (!start) return nodes;

  const order: any[] = [];
  const visited = new Set<string>();

  const queue = [start.id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodes.find((n: any) => n.id === id);
    if (node) order.push(node);
    // Enqueue all downstream neighbours
    edges
      .filter((e: any) => e.source === id)
      .forEach((e: any) => queue.push(e.target));
  }

  // Append any orphaned nodes
  nodes.forEach(n => { if (!visited.has(n.id)) order.push(n); });

  return order;
}

// ─── Worker ──────────────────────────────────────────────────────────────────

const worker = new Worker(AGENT_EXECUTION_QUEUE, async (job) => {
  const { runId, workflow } = job.data;
  console.log(`[Worker] Started processing Agent Run: ${runId}`);
  console.log(`[Worker] Workflow Name: ${workflow?.name}`);
  console.log(`[Worker] User ID: ${job.data.userId}`);

  const logs: any[] = [];

  try {
    await db
      .update(agentRuns)
      .set({ status: 'running', startTime: new Date() })
      .where(eq(agentRuns.id, runId));

    const {
      nodes   = [],
      edges   = [],
      model   = 'google/gemini-2.0-flash-001',
    } = workflow;

    // ─── Credit Check ───
    const COST_PER_RUN = 5; // Fixed cost for now
    const creditResult = await deductCredits(job.data.userId, COST_PER_RUN, `Agent Run: ${workflow.name || 'Untitled'}`);
    
    if (!creditResult.success) {
      console.log(`Run ${runId} aborted: ${creditResult.error}`);
      await db.update(agentRuns)
        .set({ 
          status: 'failed', 
          endTime: new Date(),
          logs: [{ nodeId: 'billing', label: 'Billing Check', status: 'failed', error: creditResult.error, time: new Date() }] 
        })
        .where(eq(agentRuns.id, runId));
      return;
    }

    // ─── n8n-Style Dynamic Execution Engine ───
    
    // 1. Initialise Context & State
    const ctx: Record<string, any> = {
      objective: workflow.description ?? 'Initializing.',
      workflow:  { name: workflow.name, model },
      nodes:     {} as Record<string, any>, // Access by Original Label
      ids:       {} as Record<string, any>, // Access by Node ID
    };

    const nodeMap = new Map<string, any>(nodes.map((n: any) => [n.id, n]));
    const executionCounts = new Map<string, number>();
    const pendingInputs = new Map<string, Record<string, any>>(); // NodeId -> Merged Incoming Data
    const MAX_CYCLES = 100;

    // 1. Identify Start Nodes 
    const totalInDegree = new Map<string, number>();
    edges.forEach((e: any) => totalInDegree.set(e.target, (totalInDegree.get(e.target) || 0) + 1));
    
    const startNodes = nodes.filter((n: any) => {
      const inDeg = totalInDegree.get(n.id) || 0;
      if (inDeg !== 0) return false;
      
      // If it's a trigger, only include if it's the intended trigger
      if (n.data?.isTrigger) {
        if (job.data.triggerNodeId) return n.id === job.data.triggerNodeId;
        return true; // Default to all triggers if no specific one requested
      }
      
      // Non-trigger with 0 in-degree: start only if it has outgoing edges (to provide data)
      return edges.some((e: any) => e.source === n.id);
    });

    // 2. Identify Reachable Subgraph & Calculate Active inDegree
    // This solves the problem where a node waits for an 'inactive' trigger connection.
    const reachableIds = new Set<string>();
    const subStack = startNodes.map((n: any) => n.id);
    while (subStack.length > 0) {
      const id = subStack.pop()!;
      if (reachableIds.has(id)) continue;
      reachableIds.add(id);
      edges.filter((e: any) => e.source === id).forEach((e: any) => subStack.push(e.target));
    }

    const inDegree = new Map<string, number>();
    edges.forEach((e: any) => {
      if (reachableIds.has(e.source) && reachableIds.has(e.target)) {
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    const queue: string[] = startNodes.map((n: any) => {
      pendingInputs.set(n.id, { 
        objective: workflow.description,
        trigger_output: 'Sequence Initialized.',
        ...(job.data.inputData || {})
      });
      return n.id;
    });

    let hasFailed = false;
    let failureReason = '';
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const incomingData = pendingInputs.get(nodeId) || {};
      
      const count = executionCounts.get(nodeId) ?? 0;
      if (count > MAX_CYCLES) {
        console.warn(`[Flow] Node ${nodeId} exceeded cycle limit. Breaking loop.`);
        continue;
      }
      executionCounts.set(nodeId, count + 1);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const nodeLabel = node.data?.label ?? 'Node';
      const execKey   = node.data?.executionKey ?? '';
      const config    = (node.data?.config ?? {}) as Record<string, string>;

      const logNodeStatus = async (id: string, st: any, result?: any) => {
        const existing = logs.find(l => l.nodeId === id);
        if (existing) {
          existing.status = st;
          if (result) existing.result = result;
        } else {
          logs.push({ nodeId: id, label: nodeMap.get(id)?.data?.label || 'Node', status: st, result, time: new Date() });
        }
        await db.update(agentRuns).set({ logs }).where(eq(agentRuns.id, runId));
      };

      console.log(`[Flow] Pulse reached "${nodeLabel}" (${execKey})`);
      
      // Update UI Logs
      logs.push({ nodeId, label: nodeLabel, status: 'executing', time: new Date() });
      await db.update(agentRuns).set({ logs }).where(eq(agentRuns.id, runId));

      try {
        // Prepare local context for templates: 
        // Preference: 1. Merged incoming, 2. Global Results access (n8n style)
        const localCtx = { 
          ...ctx, 
          incoming: incomingData,
          input: incomingData,
          ...incomingData // Fallback for legacy simple templates
        };
        
        // Define safer template renderer for this node
        const render = (str: string) => renderTemplate(str, localCtx);

        let nodeResult: any = {};
        let activeHandle: string | null = null;

        // ── AGENTIC TOOL DETECTION ──────────────────────────────────────────
        // If ALL outgoing edges from this node target an Agent's 'Tools' port,
        // skip normal execution and forward this node's definition instead.
        // synthesis.ts will call it dynamically via LLM tool calling.
        const outgoingEdgesCheck = edges.filter((e: any) => e.source === nodeId);
        const isAgenticToolNode  = outgoingEdgesCheck.length > 0 &&
          outgoingEdgesCheck.every((e: any) => {
            const h = (e.targetHandle || '').toLowerCase();
            return h === 'tools' || h === 'tool';
          });

        if (isAgenticToolNode) {
          console.log(`[Flow] "${nodeLabel}" is an agentic tool — forwarding definition (not executing).`);
          const nodeDef = NODE_REGISTRY.find(n => n.executionKey === execKey);
          nodeResult = {
            __toolDefinition: true,
            nodeId: nodeId, // Pass node ID so synthesis can log its usage
            executionKey: execKey,
            label: nodeLabel,
            credentialTypes: nodeDef?.credentialTypes || [],
            config,           // includes credentialId + any fallback static values
          };
        } else {
          // ── EXECUTE NODE LOGIC ─────────────────────────────────────────────
          const handler = WORKER_NODES[execKey];
          if (handler) {
            // Resolve node-specific credentials: Use selected or find default for user
            let nodeCredentials = null;
            if (config.credentialId) {
              const res = await resolveCredential(config.credentialId, job.data.userId);
              nodeCredentials = res.data;
            } else {
              // Automatic lookup: if user has a credential for this node type, use the newest valid one
              const nodeDef = NODE_REGISTRY.find(n => n.executionKey === execKey);
              if (nodeDef?.credentialTypes && nodeDef.credentialTypes.length > 0) {
                const res = await resolveDefaultCredential(nodeDef.credentialTypes, job.data.userId);
                if (res) {
                  console.log(`[Flow] Using default saved credential for "${nodeLabel}" (${res.type})`);
                  nodeCredentials = res.data;
                }
              }
            }

            const toolContext: ToolContext = {
              config,
              incomingData,
              ctx,
              job,
              userId: job.data.userId,
              credentials: nodeCredentials,
              render,
              logNodeStatus,
              nodeId,
              execKey,
              label: nodeLabel,
              handlers: WORKER_NODES,
              resolveCredential,
              resolveDefaultCredential,
            };
            nodeResult = await handler(toolContext);
            if (nodeResult && nodeResult._activeHandle) {
              activeHandle = nodeResult._activeHandle;
            }
          } else {
            console.warn(`[Worker] Unknown executionKey: ${execKey}`);
            nodeResult = { error: `Unsupported executionKey: ${execKey}` };
          }
        }


        // ── POST-EXECUTION: PROPAGATE SIGNAL ─────────────────────────────────
        // Enrich result: if text/content is JSON, spread parsed fields for template access.
        // This lets downstream nodes use {{ nodes.Agent.email_to }} when LLM outputs JSON.
        let enrichedResult = nodeResult;
        const rawText = nodeResult?.text ?? nodeResult?.content ?? nodeResult?.report ?? null;
        if (typeof rawText === 'string') {
          try {
            const stripped = rawText.trim().startsWith('```')
              ? rawText.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
              : rawText.trim();
            const parsed = JSON.parse(stripped);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              enrichedResult = { ...nodeResult, ...parsed };
            }
          } catch { /* not JSON */ }
        }

        ctx.ids[nodeId] = enrichedResult;
        ctx.nodes[nodeLabel] = enrichedResult; // Primary Access

        // Populate specific slugs for legacy compatibility
        const legacySlug = nodeLabel.toLowerCase().replace(/\s+/g, '_');
        ctx.nodes[legacySlug] = enrichedResult;

        // Update Log
        const currentLog = logs[logs.length - 1];
        const isFailed = nodeResult?.failed === true || !!nodeResult?.error || nodeResult?.status === 'failed';
        
        currentLog.status = nodeResult?.__toolDefinition ? 'pending' : (isFailed ? 'failed' : 'completed');
        currentLog.result = nodeResult;
        currentLog.endTime = new Date();

        if (isFailed && !nodeResult?.__toolDefinition) {
           console.error(`[Flow] Node "${nodeLabel}" FAILED:`, nodeResult.error);
           hasFailed = true;
           failureReason = nodeResult.error || 'Node execution failed.';
           break; // Stop the flow
        }

        // Enqueue children
        const outgoingEdges = edges.filter((e: any) => e.source === nodeId);
        for (const edge of outgoingEdges as any[]) {
          // If node has branching (handle), only follow matching wire
          if (activeHandle && edge.sourceHandle && edge.sourceHandle !== activeHandle) {
            continue; 
          }

          // Merge data into Target Node's pending input
          const targetId = edge.target;
          const targetHandle = edge.targetHandle || 'default';
          const existingInput = pendingInputs.get(targetId) || {};
          
          // n8n-style: Handle multi-connection ports (especially for Tools)
          // We store individual results by handle, but also maintain an array for multi-input handles
          const handleKey = `@port:${targetHandle}`;
          let handleData = enrichedResult;

          if (existingInput[handleKey]) {
            const current = existingInput[handleKey];
            handleData = Array.isArray(current) ? [...current, enrichedResult] : [current, enrichedResult];
          }

          pendingInputs.set(targetId, {
            ...existingInput,
            ...enrichedResult, // Direct merge — parsed JSON fields accessible as {{ field }}
            [nodeLabel]: enrichedResult,     // Label-based: {{ nodes.Agent.field }}
            [edge.source]: enrichedResult,   // ID-based: {{ ids.node_1.field }}
            [handleKey]: handleData,         // Port-based for multi-input handles
          });

          const currentInDegree = inDegree.get(targetId) || 0;
          if (currentInDegree > 1) {
            inDegree.set(targetId, currentInDegree - 1);
          } else {
            inDegree.set(targetId, 0);
            if (!queue.includes(targetId)) queue.push(targetId);
          }
        }

      } catch (err: any) {
        logs[logs.length - 1].status = 'failed';
        logs[logs.length - 1].error  = err.message;
        throw err;
      }

      await db.update(agentRuns).set({ logs }).where(eq(agentRuns.id, runId));
    }

    // 5. Finalize Run Record
    await db
      .update(agentRuns)
      .set({
        status:  hasFailed ? 'failed' : 'completed',
        endTime: new Date(),
        logs,
        output:  hasFailed 
          ? { error: failureReason, failed: true }
          : { finalResult: ctx.report ?? ctx.text ?? ctx.result ?? ctx.objective },
      })
      .where(eq(agentRuns.id, runId));

    console.log(`[Flow] Run ${runId} finalized as ${hasFailed ? 'FAILED' : 'COMPLETED'}.`);

  } catch (err: any) {
    console.error(`Run ${runId} failed:`, err.message);
    await db
      .update(agentRuns)
      .set({
        status:  'failed',
        endTime: new Date(),
        logs:    logs.length > 0 ? logs : [{ error: err.message, time: new Date() }],
      })
      .where(eq(agentRuns.id, runId));
    throw err;
  }
}, { 
  connection: redis,
  concurrency: 3 
});


worker.on('completed', (job) => console.log(`✅ Job ${job?.id} completed.`));
worker.on('failed',    (job, err) => console.log(`❌ Job ${job?.id} failed: ${err?.message}`));
