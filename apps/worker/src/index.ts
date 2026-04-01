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
  
  // Only support {{ var }} double-brace syntax.
  // Single-brace { var } is NOT supported — it would silently corrupt
  // JSON strings stored in config (e.g. {"operation":"channel_stats"}).
  return str.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_, fieldPath) => {
    try {
      let normalizedPath = fieldPath.trim();
      
      // Normalise n8n-style path aliases
      // {{ $json.field }}        → incoming.field
      // {{ input.field }}        → incoming.field
      if (normalizedPath.startsWith('$json.')) {
        normalizedPath = normalizedPath.replace('$json.', 'incoming.');
      }
      if (normalizedPath.startsWith('input.')) {
        normalizedPath = normalizedPath.replace('input.', 'incoming.');
      }
      
      // {{ $node["Label"].json.field }}  → nodes["Label"].field
      normalizedPath = normalizedPath.replace(/^\$node\["(.+?)"\]\.json\./, 'nodes["$1"].');
      
      // {{ $node.Label.json.field }}     → nodes.Label.field
      normalizedPath = normalizedPath.replace(/^\$node\.(.+?)\.json\./, 'nodes.$1.');

      // Resolve dot / bracket notation path
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
      console.warn(`[Template] Error rendering path "${fieldPath}":`, e);
      return '';
    }
  });
}

/** Try to parse a JSON string, fallback to return as-is */
function tryParseJson(str: string): any {
  try { return JSON.parse(str); } catch { return str; }
}

/** Sanitize sensitive info from strings (passwords in URLs, etc) */
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

  // Strict flow: only return nodes reached via the graph traversal.
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
    
    let startNodes = nodes.filter((n: any) => {
      // If we have a specific trigger ID, that's our ONLY start node
      if (job.data.triggerNodeId) return n.id === job.data.triggerNodeId;

      const inDeg = totalInDegree.get(n.id) || 0;
      if (inDeg !== 0) return false;
      
      // If it's a trigger, only include if it's the intended trigger
      if (n.data?.isTrigger) return true;
      
      // Non-trigger with 0 in-degree: start only if it has outgoing edges (to provide data)
      return edges.some((e: any) => e.source === n.id);
    });

    // Fallback: If triggerNodeId requested but not found in nodes list
    if (job.data.triggerNodeId && startNodes.length === 0) {
       const directNode = nodes.find((n: any) => n.id === job.data.triggerNodeId);
       if (directNode) startNodes = [directNode];
    }

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

      console.log(`[Flow] ▶▶▶ Pulse reached "${nodeLabel}" (${execKey}) at ${new Date().toISOString()}`);
      console.log(`[Flow] Incoming data keys: ${Object.keys(incomingData).slice(0, 10).join(', ')}${Object.keys(incomingData).length > 10 ? '...' : ''}`);

      // Update UI Logs
      logs.push({ nodeId, label: nodeLabel, status: 'executing', time: new Date() });
      await db.update(agentRuns).set({ logs }).where(eq(agentRuns.id, runId));

      try {
        // Prepare local context for templates.
        // IMPORTANT: Named keys MUST come AFTER the spread so they always win.
        // If incomingData contains a key called "input", "nodes", "ids" etc. the
        // spread would otherwise overwrite the correct references silently.
        //
        // Resolution priority (highest→lowest):
        //   1. nodes / ids / workflow / objective  — global workflow context
        //   2. input / incoming                    — direct alias for incomingData
        //   3. ...incomingData spread              — bare {{ field }} shorthand
        const localCtx = {
          // LOWEST: Spread incoming fields for {{ field }} bare-style templates
          ...incomingData,

          // HIGHER: Direct aliases so {{ input.X }} and {{ incoming.X }} always
          // resolve against the actual incomingData object, not a stale key
          // that a previous node may have passed along.
          incoming: incomingData,
          input: incomingData,

          // HIGHEST: Global workflow context — never overwritten by node data
          workflow: ctx.workflow,
          objective: ctx.objective,
          nodes: ctx.nodes,   // {{ nodes.NodeLabel.field }}
          ids: ctx.ids,       // {{ ids.nodeId.field }}
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
          // ── VALIDATE REQUIRED INPUTS (WITH OPERATION-SPECIFIC SUPPORT) ────────
          const nodeDef = NODE_REGISTRY.find(n => n.executionKey === execKey);
          let requiredInputs = nodeDef?.requiredInputs || [];

          // Check if this node has operation-specific inputs
          const operation = config.operation || config.resource;
          if (operation && nodeDef?.operationInputs && nodeDef.operationInputs[operation]) {
            console.log(`[Flow] Using operation-specific inputs for "${operation}"`);
            requiredInputs = [
              // Always include generic operation input
              ...(nodeDef.requiredInputs || []),
              // Add operation-specific inputs
              ...(nodeDef.operationInputs[operation] || [])
            ];
          }

          // ── SEMANTIC VALIDATION: Check if required inputs can be satisfied ──────
          // Don't require exact field name matches. Instead, check if:
          // 1. Field exists in config (exact match) OR
          // 2. Field exists in incomingData (exact match) OR
          // 3. There's any data available from upstream that COULD be mapped via templates

          const missingInputs: string[] = [];
          const upstreamDataAvailable = Object.keys(incomingData).length > 0;
          const configEmpty = Object.keys(config).length === 0;

          for (const input of requiredInputs) {
            if (input.required) {
              // Check if input is exactly available in incomingData OR in node config
              const hasExactMatchInUpstream = input.key in incomingData;
              const hasExactMatchInConfig = input.key in config;

              // If not exactly matched, check if we have ANY upstream data to potentially map
              const canBeMappedFromUpstream = upstreamDataAvailable && !hasExactMatchInConfig;

              // Input is satisfied if:
              // - Exact match in config, OR
              // - Exact match in upstream data, OR
              // - Has upstream data available for semantic mapping (Architect job)
              const isSatisfied = hasExactMatchInConfig || hasExactMatchInUpstream || canBeMappedFromUpstream;

              if (!isSatisfied) {
                missingInputs.push(`${input.key} (${input.label})`);
              }
            }
          }

          if (missingInputs.length > 0) {
            console.error(`[Flow] Node "${nodeLabel}" cannot satisfy inputs: ${missingInputs.join(', ')}`);
            console.error(`[Flow] Available upstream data keys: ${Object.keys(incomingData).join(', ') || '(none)'}`);
            console.error(`[Flow] Node config keys: ${Object.keys(config).join(', ') || '(empty)'}`);
            nodeResult = {
              failed: true,
              error: `Cannot satisfy required inputs: ${missingInputs.join(', ')}. No data available from upstream or config.`,
              status: 'failed'
            };
          } else {
            // ── EXECUTE NODE LOGIC ─────────────────────────────────────────────
            const handler = WORKER_NODES[execKey];
            if (handler) {
              // Resolve node-specific credentials: Use selected or find default for user
              let nodeCredentials: any = null;
              const isGoogleNode = execKey.startsWith('google_');

              if (config.credentialId) {
                if (isGoogleNode) {
                  // AUTO-REFRESH: Specially handle Google tokens to ensure they aren't expired
                  const token = await resolveGoogleToken(config.credentialId, job.data.userId);
                  const res = await resolveCredential(config.credentialId, job.data.userId);
                  nodeCredentials = { ...res.data, accessToken: token };
                } else {
                  const res = await resolveCredential(config.credentialId, job.data.userId);
                  nodeCredentials = res.data;
                }
              } else {
                // Automatic lookup: if user has a credential for this node type, use the newest valid one
                if (nodeDef?.credentialTypes && nodeDef.credentialTypes.length > 0) {
                  const res = await resolveDefaultCredential(nodeDef.credentialTypes, job.data.userId);
                  if (res) {
                    console.log(`[Flow] Using default saved credential for "${nodeLabel}" (${res.type})`);
                    if (isGoogleNode) {
                       const token = await resolveGoogleToken(res.id, job.data.userId);
                       nodeCredentials = { ...res.data, accessToken: token };
                    } else {
                       nodeCredentials = res.data;
                    }
                  }
                }
              }

              const nodeConfig = { ...config };
              if (nodeConfig.credentialId === '') delete nodeConfig.credentialId;

              const toolContext: ToolContext = {
                config: nodeConfig,
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
        }


        // ── POST-EXECUTION: PROPAGATE SIGNAL ─────────────────────────────────
        // Enrich result: if text/content is JSON, spread parsed fields for template access.
        // This lets downstream nodes use {{ nodes.Agent.email_to }} when LLM outputs JSON.
        // CRITICAL: Preserve __toolDefinition flag for agentic tools
        let enrichedResult = nodeResult;
        const rawText = nodeResult?.text ?? nodeResult?.content ?? nodeResult?.report ?? null;
        if (typeof rawText === 'string' && !nodeResult?.__toolDefinition) {
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

        // Update job status
        await logNodeStatus(nodeId, 'completed', enrichedResult);

        // SINGLE MODE: Break after one node if requested
        if (job.data.runMode === 'single') {
           console.log(`[Flow] Single-node mode reached. Breaking after "${nodeLabel}"`);
           break;
        }

        // Update Log
        const currentLog = logs[logs.length - 1];

        // Log execution progress for pulse flow visualization
        console.log(`[Pulse] ▶ "${nodeLabel}" executed at ${new Date().toISOString()} | Status: pending | Result keys: ${Object.keys(enrichedResult || {}).join(', ')}`);
        const isFailed = nodeResult?.failed === true || !!nodeResult?.error || nodeResult?.status === 'failed';
        
        currentLog.status = nodeResult?.__toolDefinition ? 'pending' : (isFailed ? 'failed' : 'completed');
        currentLog.result = nodeResult;
        currentLog.endTime = new Date();

        if (isFailed && !nodeResult?.__toolDefinition) {
           const safeError = sanitize(nodeResult.error || 'Node execution failed.');
           console.error(`[Flow] Node "${nodeLabel}" FAILED:`, safeError);
           hasFailed = true;
           failureReason = safeError;
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

          // Special handling for Tools port: always accumulate as array
          if (targetHandle.toLowerCase() === 'tools' || targetHandle.toLowerCase() === 'tool') {
            const existingTools = existingInput[handleKey] || [];
            handleData = Array.isArray(existingTools) ? [...existingTools, enrichedResult] : [enrichedResult];
          } else {
            // For other handles, handle multi-input normally
            if (existingInput[handleKey]) {
              const current = existingInput[handleKey];
              handleData = Array.isArray(current) ? [...current, enrichedResult] : [current, enrichedResult];
            }
          }

          pendingInputs.set(targetId, {
            ...incomingData, // PRESERVE CUMULATIVE MEMORY: Pass forward everything this node received
            ...existingInput, // Merge with any data already sent to the target from other parents
            
            // NEW DATA: Overlay this node's output
            ...(enrichedResult?.__toolDefinition ? {} : enrichedResult),
            [nodeLabel]: enrichedResult,     // Label-based: {{ nodes.Agent.field }}
            [edge.source]: enrichedResult,   // ID-based: {{ ids.node_1.field }}
            [handleKey]: handleData,         // Port-based for multi-input handles
          });

          console.log(`[Flow] Edge: "${nodeLabel}" → (${targetHandle}) | Tool definition: ${enrichedResult?.__toolDefinition ? 'YES' : 'NO'}`);

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
        logs[logs.length - 1].error  = sanitize(err.message);
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
          ? { error: sanitize(failureReason), failed: true }
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
