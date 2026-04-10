import { ChatOpenAI } from '@langchain/openai';
import { allArchitectTools } from './architect-tools.service.js';
import { log } from '../../shared/logger.js';
import { sanitize } from '../credentials/connectivity.service.js';

export const architectService = {
  async generateWorkflow(prompt: string): Promise<any> {
    try {
      const model = new ChatOpenAI({
        modelName: 'google/gemini-2.0-flash-001',
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0.1, // Lower temperature for more deterministic architectural logic
        maxTokens: 4096,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Hub AI Architect v2',
          },
        },
      });

      const modelWithTools = model.bindTools(allArchitectTools);

      const systemPrompt = `You are the Hub Workflow Architect v2. Your goal is to build a logical, connected workflow based on the user's request.

METHODOLOGY:
1. SELECT: Call 'search_marketplace' to find the best triggers and tools for the task.
2. INSPECT: Call 'get_action_details' for EVERY tool you selected to see its technical requirements and fields.
3. CONNECT: Use 'build_workflow' to wire them together.

WIRING RULES:
- Workflows MUST start with a trigger.
- Use variable syntax {{ node_id.field }} to connect data between nodes.
- Refer to node IDs clearly (e.g., trigger_manual_1, pd_slack_1).
- If the user wants to transform data, use an AI Model node (type: native, idOrSlug: llm.gemini).

Execution logic: Reason first, call tools, then output the final workflow.`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Request: ${prompt}` },
      ];

      let iteration = 0;
      while (iteration < 12) {
        iteration++;
        const response: any = await modelWithTools.invoke(messages);

        // Add assistant's thought/response to history
        messages.push({ 
          role: 'assistant', 
          content: response.content || '', 
          tool_calls: response.tool_calls 
        });

        if (response.tool_calls && response.tool_calls.length > 0) {
          for (const toolCall of response.tool_calls) {
            const tool = allArchitectTools.find(t => t.name === toolCall.name);
            if (!tool) continue;
            
            log.info(`[Architect] Calling Tool: ${toolCall.name}`);
            const argsStr = typeof toolCall.args === 'string' ? toolCall.args : JSON.stringify(toolCall.args);
            const result = await tool.func(argsStr);
            
            messages.push({ 
              role: 'user', 
              content: `Tool ${toolCall.name} result: ${result}`, 
              tool_call_id: toolCall.id 
            });
          }
        } else {
          // If no tool calls, but we haven't seen build_workflow result, the AI might be just talking.
          // In a production environment, we'd check if a final JSON was actually produced.
          break;
        }
      }

      // Look for the result of the 'build_workflow' tool in the history
      const finalToolResult = [...messages].reverse().find(m => 
        m.role === 'user' && m.content.includes('Tool build_workflow result:')
      );

      if (finalToolResult) {
        const jsonStr = finalToolResult.content.split('Tool build_workflow result: ')[1];
        const res = JSON.parse(jsonStr);
        return {
          name: res.name || 'Generated Workflow',
          description: res.description || '',
          nodes: res.nodes || [],
          edges: res.edges || [],
          explanation: messages.find(m => m.role === 'assistant' && m.content)?.content || 'Workflow generated successfully.'
        };
      }

      return { 
        name: 'Workflow', 
        description: '', 
        nodes: [], 
        edges: [], 
        explanation: 'I was able to plan the workflow but failed to finalize the technical construction. Please try again with more detail.' 
      };
    } catch (err: any) {
      log.error('[Architect] Fatal Error:', sanitize(err.message));
      throw err;
    }
  }
};

