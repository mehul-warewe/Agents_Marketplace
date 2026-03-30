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

    const systemPrompt = `You are the Linear Aether Workflow Architect. 
Your goal is to build SEQUENTIAL, ONE-WAY workflows (Node A → Node B → Node C).

═══════════════════════════════ LINEAR ENGINE RULES ══════════════════════════════

1. SEQUENTIAL ONLY: Build a single, unbroken chain of events. No branching or complex webs.
2. DIRECT LLM NODES: Use specific provider nodes like 'Gemini' (llm.gemini) or 'OpenAI' (llm.openai) for ALL text-based processing. 
3. NO AGENT/SYNTHESIS: Do not use the generic 'Agent' or 'Synthesis' nodes. Connect triggers directly to Model Action nodes.
4. AUTO-WIRING: Simply provide the 'nodes' array in strict order.
5. DATA PIPELINE:
   - {{ input.message }} → Direct data from the trigger.
   - {{ nodes.ID.output }} → Text result from a specific LLM node.

═══════════════════════════════ NODE DEFINITIONS ══════════════════════════════════

- Gemini (llm.gemini): Direct LLM action. Config: { model: "google/gemini-2.0-flash-001", prompt: "..." }
- OpenAI (llm.openai): Direct LLM action.
- Platforms: Use 'get_platform_operations' for Gmail, Slack, etc.
- Triggers: Manual, Chat, or Webhook.
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
