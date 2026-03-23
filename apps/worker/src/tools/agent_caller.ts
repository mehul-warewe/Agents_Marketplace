import { ToolContext } from './types.js';
import { createClient, agents, agentRuns, eq } from '@repo/database';
import { getRedisConnection, createExecutionQueue } from '@repo/queue';

const db = createClient(process.env.POSTGRES_URL!);
const redis = getRedisConnection();
const executionQueue = createExecutionQueue(redis);

export async function agentCaller(context: ToolContext) {
  const { config, incomingData, render, userId } = context;

  const agentId = config.agentId;
  const rawInputData = config.inputData || '{{ incoming.report }}';
  const inputData = render(rawInputData);

  if (!agentId) {
    throw new Error('agentId is required to call a published agent.');
  }

  // 1. Fetch the target agent
  const agentRows = await db.select().from(agents).where(eq(agents.id, agentId));
  const targetAgent = agentRows[0];

  if (!targetAgent) {
    throw new Error(`Target Agent (${agentId}) not found.`);
  }

  // Optional: check if published or if we own it
  if (!targetAgent.isPublished && targetAgent.creatorId !== userId) {
    throw new Error(`Cannot call Agent (${agentId}) because it is private and not owned by you.`);
  }

  // 2. Create a Run in the DB
  const runRows = await db.insert(agentRuns).values({
    agentId: targetAgent.id,
    userId: userId,
    status: 'pending',
  }).returning();
  
  const run = runRows[0];
  if (!run) throw new Error('Failed to insert agentRun');

  console.log(`[Agent Caller] Dispatching sub-agent run: ${run.id} for agent: ${targetAgent.name}`);

  // 3. Enqueue the execution
  await executionQueue.add('execute-workflow', {
    runId: run.id,
    agentId: targetAgent.id,
    workflow: targetAgent.workflow,
    userId: userId,
    inputData: { message: inputData, objective: inputData }, // Pass input as incoming data
  });

  // 4. Poll the DB until completed or failed
  // Timeout after 5 minutes
  const MAX_POLLS = 100;
  const POLL_INTERVAL_MS = 3000;
  let attempts = 0;

  while (attempts < MAX_POLLS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    attempts++;

    const checkRows = await db.select({ status: agentRuns.status, output: agentRuns.output, logs: agentRuns.logs })
      .from(agentRuns)
      .where(eq(agentRuns.id, run.id));
    
    const currentRun = checkRows[0];
    if (!currentRun) continue;

    if (currentRun.status === 'completed') {
      console.log(`[Agent Caller] Sub-agent run ${run.id} completed successfully.`);
      return {
        subRunId: run.id,
        agentName: targetAgent.name,
        output: currentRun.output,
        _logs: currentRun.logs,
      };
    }

    if (currentRun.status === 'failed') {
      const errLog = Array.isArray(currentRun.logs) ? currentRun.logs[currentRun.logs.length - 1] : null;
      throw new Error(`Sub-agent (${targetAgent.name}) failed to complete executing. ${errLog?.error || ''}`);
    }
  }

  throw new Error(`Sub-agent (${targetAgent.name}) timed out after 5 minutes.`);
}
