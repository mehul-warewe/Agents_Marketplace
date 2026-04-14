import { StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { createLLM } from "../../shared/langgraph-utils.js";
import { createManagerTools } from "./manager-tools.service.js";
import { employeesService } from "../employees/employees.service.js";

interface ManagerGraphState {
  userInput: string;
  userId: string;
  manager: any;
  messages: BaseMessage[];
  steps: any[];
  finalOutput: any;
  status: 'running' | 'completed' | 'failed';
}

export function buildManagerGraph(manager: any, userId: string, runId: string, onStep: (step: any) => void) {
  
  const workflow = new StateGraph<ManagerGraphState>({
    channels: {
      userInput: null,
      userId: null,
      manager: null,
      messages: {
        reducer: (a, b) => a.concat(b),
        default: () => [],
      },
      steps: {
        reducer: (a, b) => a.concat(b),
        default: () => [],
      },
      finalOutput: null,
      status: null,
    }
  });

  const sessionContext: Record<string, any> = { 
    mission_start: new Date(),
    initial_input: manager.goal 
  };

  const tools = createManagerTools(userId, manager.employeeIds || [], runId, onStep, sessionContext);
  const model = createLLM(manager.model).bindTools(tools);

  // 1. Supervisor Node
  workflow.addNode("supervisor", async (state) => {
    // Inject employee list into prompt to prevent ID hallucinations
    const employees = await employeesService.listEmployees(userId);
    const filteredEmployees = employees.filter(e => (state.manager.employeeIds as string[]).includes(e.id));
    const employeeInfo = filteredEmployees.map(e => `- ID: ${e.id} | Name: ${e.name} | Role: ${e.description}`).join('\n');

    const systemPrompt = `You are the ${state.manager.name} Manager Agent.
Goal: ${state.manager.goal}
Instructions: ${state.manager.systemPrompt}

YOUR SPECIALIZED WORKFORCE:
${employeeInfo || 'No employees assigned yet.'}

MISSION:
Choose the correct employee from the list above based on their role. 
Use 'call_employee' with their EXACT UUID ID.
Do NOT guess IDs.

The current user mission is: "${state.userInput}"`;

    const msgs = state.messages.length === 0 
      ? [new SystemMessage(systemPrompt), new HumanMessage(state.userInput)]
      : [new SystemMessage(systemPrompt), ...state.messages];

    const response = await model.invoke(msgs);
    
    const step = {
      thought: response.content,
      tool: (response as any).tool_calls?.[0]?.name,
      action: (response as any).tool_calls?.[0] ? `Invoking ${(response as any).tool_calls[0].name}` : 'Finalizing Results',
      type: (response as any).tool_calls?.length === 0 ? 'final' : 'thought'
    };

    onStep(step);

    return { 
      messages: [response],
      steps: [step],
      finalOutput: response.content,
      status: (response as any).tool_calls?.length === 0 ? 'completed' : 'running'
    };
  });

  // 2. Action Node (Tool execution)
  workflow.addNode("action", async (state) => {
    const lastMessage = state.messages[state.messages.length - 1] as any;
    const toolCalls = lastMessage.tool_calls || [];
    const results = [];

    for (const tc of toolCalls) {
      const tool = tools.find(t => t.name === tc.name);
      if (tool) {
        const result = await tool.invoke(tc.args);
        results.push(new ToolMessage({
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: tc.id
        }));
      }
    }

    return { messages: results };
  });

  workflow.addEdge(START, "supervisor" as any);
  
  workflow.addConditionalEdges("supervisor" as any, (state: ManagerGraphState) => {
    return state.status === 'completed' ? "end" : "continue";
  }, {
    continue: "action" as any,
    end: END
  });

  workflow.addEdge("action" as any, "supervisor" as any);

  return workflow.compile();
}
