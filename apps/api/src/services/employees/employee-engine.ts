import { EventEmitter } from "events";
import { db } from "../../shared/db.js";
import { employeeRuns, eq } from "@repo/database";
import { log } from "../../shared/logger.js";

// In-process EventEmitter map for SSE streaming, keyed by runId
const runEmitters = new Map<string, EventEmitter>();

export const employeeEngine = {
  async runEmployee(
    employeeId: string,
    userId: string,
    employee: any,
    task: string,
    context: any = {}
  ) {
    // Create initial run record
    const [run] = await db.insert(employeeRuns).values({
      employeeId,
      userId,
      status: 'pending',
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
        steps: currentSteps,
        updatedAt: new Date()
      }).where(eq(employeeRuns.id, run.id));
    };

    // Run the graph asynchronously (fire-and-forget, DB tracks status)
    (async () => {
      try {
        // Import and build the ReAct reasoning graph
        const { buildEmployeeGraph } = await import('./employee-graph.js');

        const graph = buildEmployeeGraph(employee, userId, wrappedOnStep);

        const result = await graph.invoke({
          task,
          userId,
          employee,
          groundingData: '',
          messages: [],
          steps: [],
          result: null,
          status: 'pending'
        }, { recursionLimit: 25 });

        // Update with final result
        await db.update(employeeRuns).set({
          status: result.status === 'completed' ? 'completed' : 'failed',
          output: { data: result.result, success: result.status === 'completed' },
          steps: result.steps || currentSteps,
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
