import { ChatOpenAI } from '@langchain/openai';
import { allArchitectTools } from './architect-tools.js';

async function executeTool(toolName: string, toolInput: any): Promise<string> {
  const tool = allArchitectTools.find(t => t.name === toolName);
  if (!tool) return JSON.stringify({ error: `Tool ${toolName} not found` });
  try {
    const inputStr = typeof toolInput === 'string' ? toolInput : (toolInput.input !== undefined ? toolInput.input : JSON.stringify(toolInput));
    return await tool.func(inputStr);
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

export async function generateWorkflow(prompt: string): Promise<any> {
  try {
    const model = new ChatOpenAI({
      modelName: 'google/gemini-2.0-flash-001',
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.2, // Lower temperature for more consistent tool use
      maxTokens: 4096,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'warewe AI Architect',
        },
      },
    });

    const modelWithTools = model.bindTools(allArchitectTools);

    const systemPrompt = `You are the Aether Workflow Architect. 
Your goal is to build linear, sequential workflows that start with exactly ONE trigger.

═══════════════════════════════ ARCHITECT RULES ══════════════════════════════

1. SINGLE TRIGGER: Every workflow MUST start with exactly one trigger (Chat, Manual, or Webhook).
2. SEQUENTIAL ONLY: Build a single, unbroken chain of events (Trigger → Node 1 → Node 2).
3. CLEAN IDs: Identify nodes using the format 'type_provider_index' (e.g., trigger_chat_1, llm_gemini_1, tool_slack_1).
4. FLAT VARIABLES: Use simple, flat variable syntax for data flow:
   - {{ message }} → Data from the Chat trigger.
   - {{ llm_gemini_1.result }} → Text result from a specific Gemini node.
   - {{ tool_github_1.result }} → Data from a platform tool.
5. NO GENERIC NODES: Use specific provider nodes (llm.gemini, llm.openai) for all AI logic.

═══════════════════════════════ NODE TYPES ═══════════════════════════════════

- Triggers: trigger.chat, trigger.manual, trigger.webhook.
- Models: llm.gemini (Gemini 2.0 Flash), llm.openai (GPT-4o).
- Tools: Use 'get_platform_operations' to explore Gmail, Slack, GitHub, etc.
`;

    const userMessage = `Build a workflow for: ${prompt}

FOLLOW THIS SPEED RUN:
1. get_architect_context (Discover everything)
2. generate_final_workflow (Build nodes and edges and FINISH)`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let maxIterations = 10; // Reduced limit for speed
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`[Architect] Iteration ${iteration}`);

      const response = await modelWithTools.invoke(messages);

      if (response.tool_calls && response.tool_calls.length > 0) {
        messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.tool_calls,
        });

        for (const toolCall of response.tool_calls) {
          console.log(`[Architect] Executing: ${toolCall.name}`);
          const result = await executeTool(toolCall.name, toolCall.args);
          console.log(`[Architect] Result: ${result.substring(0, 100)}...`);

          messages.push({
            role: 'user', // LangChain/Gemini via OpenRouter often expects user role for results in this loop
            content: `Tool ${toolCall.name} result: ${result}`,
            tool_call_id: toolCall.id,
          });
        }
      } else {
        // Final response from LLM (should be the tool output of generate_final_workflow)
        console.log('[Architect] LLM Finished Turns');
        break;
      }
    }

    // Search messages for the result of 'generate_final_workflow'
    // ONLY capture if it has nodes to avoid capturing error responses
    const finalResult = [...messages].reverse().find(
      m => {
        const isAction = (m.role === 'user' || m.role === 'tool') && 
                         m.content.includes('Tool generate_final_workflow result:');
        if (!isAction) return false;
        try {
          const json = JSON.parse(m.content.split('Tool generate_final_workflow result: ')[1]);
          return Array.isArray(json.nodes) && json.nodes.length > 0;
        } catch {
          return false;
        }
      }
    );

    if (finalResult) {
      try {
        const jsonStr = finalResult.content.split('Tool generate_final_workflow result: ')[1];
        const res = JSON.parse(jsonStr);
        
        if (Array.isArray(res.nodes) && res.nodes.length > 0) {
          console.log(`[Architect] Workflow extracted successfully with ${res.nodes.length} nodes`);
          return {
            name: res.name || 'Generated Workflow',
            description: res.description || '',
            nodes: res.nodes,
            edges: res.edges || [],
            explanation: res.explanation || 'Workflow ready.',
          };
        } else {
          console.warn('[Architect] Extracted result has no nodes or is empty');
        }
      } catch (e) {
        console.error('[Architect] Failed to parse final result:', e);
      }
    }

    return {
      name: 'Generated Workflow',
      description: 'Workflow generated from your request',
      nodes: [],
      edges: [],
      explanation: 'Could not fully auto-generate. Please configure nodes manually.',
    };
  } catch (err: any) {
    console.error('[Architect] Fatal Error:', err.message);
    throw err;
  }
}
