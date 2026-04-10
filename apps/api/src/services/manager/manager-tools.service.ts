import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentsService } from "../agents/agents.service.js";
import { db } from "../../shared/db.js";
import { memories, eq, and, managerRuns, sql } from "@repo/database";

export const createManagerTools = (
  userId: string,
  workerIds: string[],
  managerRunId?: string,
  onProgress?: (step: any) => void
) => {
  return [
    new DynamicStructuredTool({
      name: "list_available_workers",
      description: "Lists all specialized worker agents you have access to. Use this to understand their capabilities.",
      schema: z.object({}),
      func: async () => {
        const workers = await agentsService.listWorkers(userId);
        const filtered = workers.filter(w => workerIds.includes(w.id));
        return JSON.stringify(filtered.map(w => ({
          id: w.id,
          name: w.name,
          capability: w.workerDescription,
          input_schema: w.workerInputSchema
        })));
      }
    }),
    
    new DynamicStructuredTool({
        name: "call_worker",
        description: "Invokes a specific worker agent with a structured mission input. Returns the final result from the worker.",
        schema: z.object({
           worker_id: z.string().describe("The ID of the worker to call"),
           task_input: z.any().describe("The JSON object to pass as input to the worker")
        }),
        func: async ({ worker_id, task_input }) => {
           const res = await agentsService.runAgent(worker_id, userId, { inputData: task_input });

           // Emit progress event for worker dispatch
           if (onProgress) {
              onProgress({ type: 'worker_called', workerId: worker_id, runId: res.runId });
           }

           // Track the child run in the manager run's childRunIds
           if (managerRunId) {
              await db.update(managerRuns).set({
                 childRunIds: sql`${managerRuns.childRunIds} || jsonb_build_array(${res.runId})`
              }).where(eq(managerRuns.id, managerRunId));
           }

           // We need to poll for the result since runAgent is async via BullMQ
           // For a more robust version, we'd use a synchronous worker execution mode
           let attempts = 0;
           let result = "Worker timed out.";
           while (attempts < 60) {
              const run = await agentsService.getAgentRun(res.runId);
              if (!run) {
                 attempts++;
                 await new Promise(resolve => setTimeout(resolve, 2000));
                 continue;
              }
              if (run.status === 'completed') {
                 result = JSON.stringify(run.output);
                 break;
              }
              if (run.status === 'failed') {
                 result = "Worker execution failed.";
                 break;
              }
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 2000));
           }

           // Emit progress event for worker completion
           if (onProgress) {
              onProgress({ type: 'worker_done', workerId: worker_id, result });
           }

           return result;
        }
    }),

    new DynamicStructuredTool({
      name: "memorize",
      description: "Saves a key-value pair to long-term memory for future recall.",
      schema: z.object({
        key: z.string(),
        value: z.any()
      }),
      func: async ({ key, value }) => {
        await db.insert(memories).values({
          userId,
          key,
          value
        }).onConflictDoUpdate({
           target: [memories.userId, memories.key],
           set: { value, updatedAt: new Date() }
        });
        return "Memory saved.";
      }
    }),

    new DynamicStructuredTool({
       name: "recall_memory",
       description: "Retrieves a value from long-term memory by key.",
       schema: z.object({
          key: z.string()
       }),
       func: async ({ key }) => {
          const rows = await db.select().from(memories).where(and(eq(memories.userId, userId), eq(memories.key, key)));
          return JSON.stringify(rows[0]?.value || "No memory found for this key.");
       }
    })
  ];
};
