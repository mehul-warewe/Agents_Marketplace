import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from '@langchain/classic/tools';
import { z } from 'zod';
import { ToolContext } from '../types.js';
import { TOOL_SCHEMAS } from './tool_schemas.js';

/**
 * Creates a LangChain Chat Model based on the provided configuration.
 */
export async function getLangChainModel(config: any, userId: string) {
  const modelName = config.model || 'openai/gpt-4o';
  const credentialId = config.credentialId;
  
  // Note: credentials should be resolved by the worker and passed into context.
  // This helper used to call resolveCredential, but in modular mode we expect 
  // the caller to provide the resolved apiKey if needed, or we use ctx.credentials.
  
  let apiKey = '';
  let provider = 'openai';
  let baseURL = 'https://openrouter.ai/api/v1';

  // Extract from config if passed directly (e.g. from synthesis call)
  apiKey = config.apiKey || '';

  if (modelName.includes('anthropic/')) provider = 'anthropic';
  else if (modelName.includes('google/')) provider = 'google';
  else if (modelName.includes('openai/')) {
      provider = 'openai';
      baseURL = 'https://api.openai.com/v1';
  }

  const commonParams = {
    apiKey,
    temperature: typeof config.temperature === 'number' ? config.temperature : 0,
  };

  if (provider === 'anthropic') {
    return new ChatAnthropic({ 
      ...commonParams,
      modelName: modelName.replace('anthropic/', ''),
      maxTokens: 4096 
    });
  }

  if (provider === 'google') {
    return new ChatGoogleGenerativeAI({
      ...commonParams,
      model: modelName.replace('google/', ''),
      maxOutputTokens: 4096,
    });
  }

  return new ChatOpenAI({
    ...commonParams,
    modelName: modelName,
    maxTokens: 4096,
    configuration: { baseURL },
  });
}

export function getLangChainTools(
  toolDefinitions: any[], 
  handlers: Record<string, any>, 
  context: ToolContext
): any[] {
  return toolDefinitions
    .filter(def => TOOL_SCHEMAS[def.executionKey])
    .map(def => {
      const schema = TOOL_SCHEMAS[def.executionKey]!;
      const handler = handlers[def.executionKey];

      if (!handler) {
        console.warn(`[LangChain] No handler found for ${def.executionKey}. Skipping tool.`);
        return null;
      }

      const schemaShape: Record<string, z.ZodTypeAny> = {};
      const props = schema.parameters.properties;
      const required = schema.parameters.required || [];

      Object.keys(props).forEach(key => {
        let field: z.ZodTypeAny = z.any();
        const type = props[key].type;
        if (props[key].enum) field = z.enum(props[key].enum);
        else if (type === 'string') field = z.string();
        else if (type === 'number' || type === 'integer') field = z.number();
        else if (type === 'boolean') field = z.boolean();
        else if (type === 'array') field = z.array(z.any());
        if (props[key].description) field = field.describe(props[key].description);
        schemaShape[key] = required.includes(key) ? field : field.optional();
      });

      return new DynamicStructuredTool({
        name: def.executionKey,
        description: schema.description,
        schema: z.object(schemaShape),
        func: async (args) => {
          try {
            const mergedConfig = { ...def.config, ...args };
            // Handlers are expected to be context-aware
            const result = await handler({ ...context, config: mergedConfig, incomingData: {} });
            return JSON.stringify(result);
          } catch (err: any) {
            return JSON.stringify({ error: err.message, status: 'failed' });
          }
        }
      });
    })
    .filter(t => t !== null);
}
