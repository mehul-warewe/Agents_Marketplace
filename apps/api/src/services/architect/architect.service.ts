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
        temperature: 0.2,
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

      const systemPrompt = `You are the Aether Workflow Architect. Build linear, sequential workflows. 
  1. Single trigger first.
  2. Clean IDs (type_provider_index).
  3. Flat variables ({{ message }}, {{ llm_gemini_1.result }}).`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Build a workflow for: ${prompt}. Start by getting context.` },
      ];

      let iteration = 0;
      while (iteration < 10) {
        iteration++;
        const response = await modelWithTools.invoke(messages);

        if (response.tool_calls && response.tool_calls.length > 0) {
          messages.push({ role: 'assistant', content: response.content || '', tool_calls: response.tool_calls });
          for (const toolCall of response.tool_calls) {
            const tool = allArchitectTools.find(t => t.name === toolCall.name);
            if (!tool) continue;
            
            const argsStr = typeof toolCall.args === 'string' ? toolCall.args : JSON.stringify(toolCall.args);
          const result = await tool.func(argsStr);
            messages.push({ role: 'user', content: `Tool ${toolCall.name} result: ${result}`, tool_call_id: toolCall.id });
          }
        } else {
          break;
        }
      }

      const finalResult = [...messages].reverse().find(m => m.content.includes('Tool generate_final_workflow result:'));
      if (finalResult) {
        const jsonStr = finalResult.content.split('Tool generate_final_workflow result: ')[1];
        const res = JSON.parse(jsonStr);
        return {
          name: res.name || 'Generated Workflow',
          description: res.description || '',
          nodes: res.nodes || [],
          edges: res.edges || [],
          explanation: res.explanation || 'Workflow ready.',
        };
      }

      return { name: 'Workflow', description: '', nodes: [], edges: [], explanation: 'Failed to generate.' };
    } catch (err: any) {
      log.error('[Architect] Fatal Error:', sanitize(err.message));
      throw err;
    }
  }
};

