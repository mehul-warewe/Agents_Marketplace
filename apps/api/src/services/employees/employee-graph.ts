import { StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createLLM } from "../../shared/langgraph-utils.js";
import { knowledgeService } from "../knowledge/knowledge.service.js";
import { skillsService } from "../skills/skills.service.js";
import { db } from "../../shared/db.js";
import { skills, inArray } from "@repo/database";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmployeeGraphState {
  task: string;
  userId: string;
  employee: any;
  groundingData: string;
  messages: BaseMessage[];
  steps: any[];
  result: any;
  status: 'pending' | 'completed' | 'failed';
}

// ─── Schema Builder ──────────────────────────────────────────────────────────

/**
 * Converts a skill's inputSchema array into a Zod object schema.
 * Falls back to { input: z.string() } for skills with no typed schema defined.
 */
function buildZodSchema(inputSchema: any[]): z.ZodObject<any> {
  if (!inputSchema || inputSchema.length === 0) {
    return z.object({ input: z.string().describe("The task or request for this skill") });
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const param of inputSchema) {
    let field: z.ZodTypeAny;
    if (param.type === 'number') field = z.number();
    else if (param.type === 'boolean') field = z.boolean();
    else field = z.string();

    field = field.describe(param.description || param.name);
    if (!param.required) field = field.optional();
    shape[param.name] = field;
  }
  return z.object(shape);
}

// ─── Graph Builder ────────────────────────────────────────────────────────────

export function buildEmployeeGraph(employee: any, userId: string, onStep?: (step: any) => void) {
  
  // Load all assigned skills and build typed LangChain tools from them
  // This is done outside the workflow so all nodes share the same tools reference
  let skillTools: DynamicStructuredTool[] = [];

  const workflow = new StateGraph<EmployeeGraphState>({
    channels: {
      task: null,
      userId: null,
      employee: null,
      groundingData: null,
      messages: {
        reducer: (a, b) => a.concat(b),
        default: () => [],
      },
      steps: {
        reducer: (a, b) => a.concat(b),
        default: () => [],
      },
      result: null,
      status: null,
    }
  });

  // ── Node 1: Grounding ─────────────────────────────────────────────────────
  // Fetches relevant knowledge from the employee's knowledge base via keyword search
  workflow.addNode("grounding", (async (state: EmployeeGraphState) => {
    const knowledgeIds = (state.employee as any).knowledgeIds || [];
    let groundingData = "";
    if (knowledgeIds.length > 0) {
      const relevantInfo = await knowledgeService.searchKnowledge(
        state.userId, state.task, knowledgeIds
      );
      if (relevantInfo.length > 0) {
        groundingData = relevantInfo
          .map(k => `[${k.title}]\n${k.content}`)
          .join('\n---\n');
      }
    }
    return { groundingData };
  }) as any);

  // ── Node 2: Prepare Tools ─────────────────────────────────────────────────
  // Loads assigned skills from DB and builds them as typed LangChain tools
  workflow.addNode("prepare_tools", (async (state: EmployeeGraphState) => {
    const skillIds = (state.employee.skillIds as string[]) || [];
    if (skillIds.length === 0) {
      return {};
    }

    const assignedSkills = await db.select().from(skills).where(inArray(skills.id, skillIds));

    skillTools = assignedSkills.map(skill => {
      const zodSchema = buildZodSchema((skill.inputSchema as any[]) || []);
      const instr = (state.employee.skillInstructions as any)?.[skill.id] || '';

      return new DynamicStructuredTool({
        name: `skill_${skill.id.replace(/-/g, '_')}`,
        description: [
          skill.description || skill.name,
          skill.outputDescription ? `Returns: ${skill.outputDescription}` : '',
          instr ? `When to use: ${instr}` : '',
        ].filter(Boolean).join('\n'),
        schema: zodSchema,
        func: async (args) => {
          // This is the actual invocation — calls the BullMQ worker and polls for result
          const result = await skillsService.invokeSkillAsToolSync(skill.id, userId, args);
          if (!result.success) return `Error: ${result.error}`;
          return typeof result.data === 'string' 
            ? result.data 
            : JSON.stringify(result.data, null, 2);
        }
      });
    });

    return {};
  }) as any);

  // ── Node 3: ReAct Loop ────────────────────────────────────────────────────
  // Full Thought → Act → Observe reasoning loop using the skill tools
  workflow.addNode("reason", (async (state: EmployeeGraphState) => {
    const model = createLLM(state.employee.model, state.employee.temperature ?? 0.1).bindTools(skillTools);

    const systemPrompt = `IDENTITY & ROLE:
${state.employee.systemPrompt || 'You are a professional AI operative.'}

${state.groundingData ? `KNOWLEDGE BASE:\n${state.groundingData}\n` : ''}

INSTRUCTIONS:
- You are "${state.employee.name}".
- You have access to specialized skills as tools. Use them to complete the task.
- Reason step by step. You MUST use at least one tool if available.
- When you have a final answer, respond directly without calling any more tools.`;

    const msgs = [
      new SystemMessage(systemPrompt),
      ...state.messages
    ];

    const response = await model.invoke(msgs);
    const hasToolCalls = (response as any).tool_calls?.length > 0;

    const step = {
      type: hasToolCalls ? 'thought' : 'final',
      thought: response.content,
      action: hasToolCalls ? (response as any).tool_calls.map((tc: any) => tc.name).join(', ') : 'Final Response',
      timestamp: new Date()
    };

    if (onStep) onStep(step);

    return {
      messages: [response],
      steps: [step],
      status: hasToolCalls ? 'pending' : 'completed',
      result: hasToolCalls ? null : response.content,
    };
  }) as any);

  // ── Node 4: Execute Tool ──────────────────────────────────────────────────
  // Runs the selected skill tool and injects the observation back as a ToolMessage
  workflow.addNode("execute_tool", (async (state: EmployeeGraphState) => {
    const lastMessage = state.messages[state.messages.length - 1] as any;
    const toolCalls = lastMessage?.tool_calls || [];

    const toolResults = await Promise.all(toolCalls.map(async (tc: any) => {
      const tool = skillTools.find(t => t.name === tc.name);
      if (!tool) return null;
      try {
        const result = await tool.invoke(tc.args);
        return new ToolMessage({
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: tc.id,
        });
      } catch (err: any) {
        return new ToolMessage({
          content: `Tool error: ${err.message}`,
          tool_call_id: tc.id,
        });
      }
    }));

    const validResults = toolResults.filter((r): r is ToolMessage => r !== null);

    const step = {
      type: 'observation',
      observation: validResults.map(tr => tr.content).join('\n---\n'),
      timestamp: new Date()
    };
    if (onStep) onStep(step);

    return { 
      messages: validResults,
      steps: [step]
    };
  }) as any);

  // ─── Edges ────────────────────────────────────────────────────────────────

  workflow.addEdge(START, "grounding" as any);
  workflow.addEdge("grounding" as any, "prepare_tools" as any);
  workflow.addEdge("prepare_tools" as any, "reason" as any);

  // Conditional: if the model made tool calls, execute them and loop back to reason
  workflow.addConditionalEdges("reason" as any, (state: any) => {
    return state.status === 'completed' ? "done" : "execute";
  }, {
    execute: "execute_tool" as any,
    done: END,
  });

  workflow.addEdge("execute_tool" as any, "reason" as any);

  return workflow.compile();
}
