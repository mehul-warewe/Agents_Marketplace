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

    const tools = createManagerTools(userId, manager.workerIds || [], run.id, wrappedOnStep);
    const model = new ChatOpenAI({
      modelName: manager.model || 'google/gemini-2.0-flash-001',
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.2,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Hub Manager Engine',
        },
      },
    }).bindTools(tools);

    const systemPrompt = `You are the ${manager.name} Manager Agent.
Goal: ${manager.goal}
Instructions: ${manager.systemPrompt}

You have access to specialized workers. Use 'list_available_workers' if you are unsure who can help.
The current mission is: "${userInput}"

Break down the user's mission, call relevant workers, and synthesize the result.
Be decisive and professional.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ];

    const currentSteps: any[] = [];

    try {
      let iteration = 0;
      while (iteration < 15) {
        iteration++;
        const response: any = await model.invoke(messages);
        
        const thought = response.content;
        const toolCalls = response.tool_calls || [];

        const step = {
          thought,
          tool: toolCalls[0]?.name,
          action: toolCalls[0] ? `Invoking ${toolCalls[0].name}` : 'Finalizing Results',
          type: toolCalls.length === 0 ? 'final' : 'thought'
        };
        
        currentSteps.push(step);
        wrappedOnStep(step);
        
        messages.push({ 
          role: "assistant", 
          content: thought || "", 
          tool_calls: toolCalls 
        });

        if (toolCalls.length > 0) {
          for (const tc of toolCalls) {
            const tool = tools.find(t => t.name === tc.name);
            if (tool) {
               log.info(`[ManagerEngine] Running tool: ${tc.name}`);
               const result = await tool.invoke(tc.args);
               messages.push({
                 role: "tool",
                 content: `Tool ${tc.name} result: ${result}`,
                 tool_call_id: tc.id
               });
            }
          }
        } else {
           break;
        }
      }

      const lastStep = currentSteps[currentSteps.length - 1];
      await db.update(managerRuns).set({
        status: 'completed',
        steps: currentSteps,
        output: lastStep,
        endTime: new Date()
      }).where(eq(managerRuns.id, run.id));

      // Signal completion and clean up emitter
      emitter.emit('done', { status: 'completed', output: lastStep });
      runEmitters.delete(run.id);

    } catch (err: any) {
      log.error(`[ManagerEngine] Error: ${err.message}`);
      await db.update(managerRuns).set({
        status: 'failed',
        steps: currentSteps,
        output: { error: err.message },
        endTime: new Date()
      }).where(eq(managerRuns.id, run.id));
      wrappedOnStep({ type: 'error', thought: `Strategic failure: ${err.message}` });

      // Signal completion and clean up emitter
      emitter.emit('done', { status: 'failed', error: err.message });
      runEmitters.delete(run.id);
    }

    return run.id;
  },

  getEmitter(runId: string): EventEmitter | undefined {
    return runEmitters.get(runId);
  }
};
