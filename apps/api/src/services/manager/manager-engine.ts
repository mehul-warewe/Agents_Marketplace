import { ChatOpenAI } from "@langchain/openai";
import { EventEmitter } from "events";
import { createManagerTools } from "./manager-tools.service.js";
import { managerService } from "./manager.service.js";
import { db } from "../../shared/db.js";
import { managerRuns, eq } from "@repo/database";
import { log } from "../../shared/logger.js";

// In-process EventEmitter map for SSE streaming, keyed by runId
const runEmitters = new Map<string, EventEmitter>();

export const managerEngine = {
  async runManager(managerId: string, userId: string, userInput: string, onStep: (step: any) => void) {
    const manager = await managerService.getManager(managerId);
    if (!manager) throw new Error("Manager not found");

    const [run] = await db.insert(managerRuns).values({
      managerId,
      userId,
      input: userInput,
      status: 'running',
    }).returning();

    if (!run) throw new Error("Failed to create manager run");

    // Create and store EventEmitter for SSE streaming
    const emitter = new EventEmitter();
    runEmitters.set(run.id, emitter);

    // Wrap onStep to also emit to the EventEmitter
    const wrappedOnStep = (step: any) => {
      emitter.emit('step', step);
      onStep(step);
    };

    wrappedOnStep({ type: 'init', runId: run.id });
    
    // Import the graph builder
    const { buildManagerGraph } = await import('./manager-graph.js');
    const graph = buildManagerGraph(manager, userId, run.id, wrappedOnStep);

    // Run the graph asynchronously
    (async () => {
      try {
        const result = await graph.invoke({
          userInput,
          userId,
          manager,
          messages: [],
          steps: [],
          finalOutput: null,
          status: 'running'
        }, { recursionLimit: 100 });

        await db.update(managerRuns).set({
          status: 'completed',
          steps: result.steps,
          output: result.finalOutput,
          endTime: new Date()
        }).where(eq(managerRuns.id, run.id));

        emitter.emit('done', { status: 'completed', output: result.finalOutput });
        runEmitters.delete(run.id);
      } catch (err: any) {
        console.error(`[ManagerGraph:${run.id}] Strategic failure:`, err);
        await db.update(managerRuns).set({
          status: 'failed',
          output: { error: err.message },
          endTime: new Date()
        }).where(eq(managerRuns.id, run.id));
        wrappedOnStep({ type: 'error', thought: `Strategic failure: ${err.message}` });
        
        emitter.emit('done', { status: 'failed', error: err.message });
        runEmitters.delete(run.id);
      }
    })();

    return run.id;
  },

  getEmitter(runId: string): EventEmitter | undefined {
    return runEmitters.get(runId);
  }
};
