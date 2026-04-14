import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { employeesService } from "../employees/employees.service.js";
import { db } from "../../shared/db.js";
import { memories, eq, and, managerRuns, sql } from "@repo/database";

export const createManagerTools = (
  userId: string,
  employeeIds: string[],
  managerRunId?: string,
  onProgress?: (step: any) => void,
  sessionContext: Record<string, any> = {}
) => {
  return [
    new DynamicStructuredTool({
      name: "list_available_employees",
      description: "Lists all specialized employees (AI personas) you have access to. Use this to understand their specialized roles and assigned skills.",
      schema: z.object({}),
      func: async () => {
        const employees = await employeesService.listEmployees(userId);
        const filtered = employees.filter(e => employeeIds.includes(e.id));
        return JSON.stringify(filtered.map(e => ({
          id: e.id,
          name: e.name,
          role: e.description,
          assigned_skills: e.skillIds?.length || 0
        })));
      }
    }),
    
    new DynamicStructuredTool({
        name: "call_employee",
        description: "Assigns a task to a specialized employee. The employee will use their assigned skills to complete the request.",
        schema: z.object({
           employee_id: z.string().describe("The ID of the employee to call"),
           task_input: z.string().describe("The natural language description of the task for the employee")
        }),
        func: async ({ employee_id, task_input }) => {
           // We pass the global sessionContext to the employee for continuity
           const res = await employeesService.runEmployee(employee_id, userId, task_input, sessionContext);

           // Emit progress event for employee dispatch with initial reasoning (if we had it, but for now we have the skill selection)
           if (onProgress) {
              onProgress({ 
                type: 'employee_called', 
                employeeId: employee_id, 
                runId: res.runId,
                thought: `Operative is analyzing the request. Protocol established: ${res.message}`
              });
           }

           // Track the child run in the manager run's childRunIds
           if (managerRunId) {
              await db.update(managerRuns).set({
                 childRunIds: sql`${managerRuns.childRunIds} || jsonb_build_array(${res.runId}::text)`
              }).where(eq(managerRuns.id, managerRunId));
           }

           // Poll for results
           let attempts = 0;
           let result = "Employee timed out.";
           while (attempts < 60) {
              const runs = await employeesService.getRuns(employee_id, userId);
              const run = runs.find(r => r.id === res.runId);
              
              if (!run) {
                 attempts++;
                 await new Promise(resolve => setTimeout(resolve, 2000));
                 continue;
              }
              if (run.status === 'completed') {
                 result = JSON.stringify(run.output);
                 // Update session context with the result for future handoffs
                 sessionContext[`last_result_${employee_id.slice(0,4)}`] = run.output;
                 break;
              }
              if (run.status === 'failed') {
                 result = "Employee execution failed.";
                 break;
              }
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 2000));
           }

           // Emit progress event for employee completion
           if (onProgress) {
              onProgress({ type: 'employee_done', employeeId: employee_id, result });
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
