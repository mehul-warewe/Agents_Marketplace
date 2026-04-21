import { EventEmitter } from "events";
import { db } from "../../shared/db.js";
import { employeeRuns, eq, desc, and, ne } from "@repo/database";
import { log } from "../../shared/logger.js";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";

function mapToLangChain(msgs: any[]): BaseMessage[] {
  if (!msgs || !Array.isArray(msgs)) return [];
  return msgs.map(m => {
    switch (m.role) {
      case 'human': return new HumanMessage(m.content);
      case 'ai': return new AIMessage({ content: m.content, tool_calls: m.tool_calls });
      case 'system': return new SystemMessage(m.content);
      case 'tool': return new ToolMessage({ content: m.content, tool_call_id: m.tool_call_id });
      default: return new HumanMessage(m.content);
    }
  });
}

function mapFromLangChain(msgs: BaseMessage[]) {
  return msgs.map(m => {
    const type = (m as any)._getType();
    return {
      role: type === 'human' ? 'human' : type === 'ai' ? 'ai' : type === 'system' ? 'system' : 'tool',
      content: m.content,
      tool_calls: (m as any).tool_calls,
      tool_call_id: (m as any).tool_call_id
    };
  });
}

// In-process EventEmitter map for SSE streaming, keyed by runId
const runEmitters = new Map<string, EventEmitter>();

export const employeeEngine = {
  async runEmployee(
    employeeId: string,
    userId: string,
    employee: any,
    task: string,
    context: any = {},
    threadId?: string
  ) {
    // Create initial run record
    const [run] = await db.insert(employeeRuns).values({
      employeeId,
      userId,
      status: 'pending',
      threadId: threadId || null,
      inputData: {
        task: task,
        context: context || {}
      }
    }).returning();

    if (!run) throw new Error("Failed to initialize employee run record.");

    // Create and store EventEmitter for SSE streaming
    const emitter = new EventEmitter();
    runEmitters.set(run.id, emitter);

    // Track steps for incremental DB updates
    let currentSteps: any[] = [];

    // Wrap onStep to emit to EventEmitter AND update DB
    const wrappedOnStep = async (step: any) => {
      currentSteps.push(step);
      emitter.emit('step', step);

      // Incrementally update DB
      await db.update(employeeRuns).set({
        steps: currentSteps
      }).where(eq(employeeRuns.id, run.id));
    };

    // Run the graph asynchronously (fire-and-forget, DB tracks status)
    (async () => {
      try {
        // Update status to running immediately
        await db.update(employeeRuns).set({ status: 'running' }).where(eq(employeeRuns.id, run.id));

        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error('OPENROUTER_API_KEY is missing from environment.');
        }

        // Fetch Conversation History
        let historyMessages: any[] = [];
        if (threadId) {
          const lastRun = await db.select({ messages: employeeRuns.messages })
            .from(employeeRuns)
            .where(and(
              eq(employeeRuns.employeeId, employeeId), 
              eq(employeeRuns.threadId, threadId),
              ne(employeeRuns.id, run.id)
            ))
            .orderBy(desc(employeeRuns.startTime))
            .limit(1);
          
          if (lastRun[0]?.messages) {
             historyMessages = lastRun[0].messages as any[];
          }
        }

        const { buildEmployeeGraph } = await import('./employee-graph.js');
        const graph = buildEmployeeGraph(employee, userId, wrappedOnStep);
        const result = await graph.invoke({
          task,
          userId,
          employee,
          groundingData: '',
          messages: [
            ...mapToLangChain(historyMessages),
            new HumanMessage(task)
          ],
          steps: [],
          result: null,
          status: 'pending' // Initial state for the reasoner node
        }, { recursionLimit: 25 });
        
        // Update with final result and PERSISTED HISTORY
        await db.update(employeeRuns).set({
          status: result.status === 'completed' ? 'completed' : 'failed',
          output: { data: result.result, success: result.status === 'completed' },
          steps: result.steps || currentSteps,
          messages: mapFromLangChain(result.messages),
          endTime: new Date()
        }).where(eq(employeeRuns.id, run.id));

        emitter.emit('done', {
          status: result.status === 'completed' ? 'completed' : 'failed',
          output: { data: result.result, success: result.status === 'completed' }
        });
        runEmitters.delete(run.id);
      } catch (err: any) {
        console.error(`[EmployeeGraph:${run.id}] Execution failed:`, err);

        await db.update(employeeRuns).set({
          status: 'failed',
          output: { error: err.message, success: false },
          endTime: new Date()
        }).where(eq(employeeRuns.id, run.id));

        emitter.emit('done', {
          status: 'failed',
          error: err.message
        });
        runEmitters.delete(run.id);
      }
    })();

    return run.id;
  },

  getEmitter(runId: string): EventEmitter | undefined {
    return runEmitters.get(runId);
  }
};
