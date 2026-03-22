import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from '@langchain/classic/tools';
import { z } from 'zod';
import { resolveCredential } from '../../credentialResolver.js';
import { TOOL_SCHEMAS } from '../../tools/toolSchemas.js';
import { ToolContext } from '../../tools/types.js';

/**
 * Creates a LangChain Chat Model based on the provided configuration.
 */
export async function getLangChainModel(config: any, userId: string) {
  const modelName = config.model || 'openai/gpt-4o';
  const credentialId = config.credentialId;
  
  let apiKey = '';
  let provider = 'openai';
  let baseURL = 'https://openrouter.ai/api/v1';

  if (credentialId) {
    const cred = await resolveCredential(credentialId, userId);
    apiKey = cred.data.apiKey || cred.data.key || cred.data.password || '';
    
    if (!apiKey) {
      console.warn(`[LangChain] Credential ${credentialId} resolved but apiKey is empty!`);
    }

    if (cred.type === 'openai_api_key') {
      provider = 'openai';
      baseURL = 'https://api.openai.com/v1';
    } else if (cred.type === 'anthropic_api_key') {
      provider = 'anthropic';
    } else if (cred.type === 'google_api_key') {
      provider = 'google';
    } else if (cred.type === 'openrouter_api_key') {
      provider = 'openai';
      baseURL = 'https://openrouter.ai/api/v1';
    }
  } else {
    // Fallback to Env variables if no credential
    if (modelName.includes('gemini') || modelName.startsWith('google/')) {
      provider = 'google';
      apiKey = process.env.GOOGLE_API_KEY || '';
    } else if (modelName.includes('claude') || modelName.startsWith('anthropic/')) {
      provider = 'anthropic';
      apiKey = process.env.ANTHROPIC_API_KEY || '';
    } else {
      provider = 'openai';
      apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
      baseURL = process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1';
    }
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

  // Default to OpenAI/OpenRouter — cap tokens to avoid credit blowout
  return new ChatOpenAI({
    ...commonParams,
    modelName: modelName,
    maxTokens: 4096,
    configuration: { baseURL },
  });
}

/**
 * Converts the worker's tool definitions into LangChain DynamicStructuredTools.
 */
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

      // Build Zod schema from JSON schema
      const schemaShape: Record<string, z.ZodTypeAny> = {};
      const props = schema.parameters.properties;
      const required = schema.parameters.required || [];

      Object.keys(props).forEach(key => {
        let field: z.ZodTypeAny = z.any();
        const type = props[key].type;
        
        if (props[key].enum) {
          field = z.enum(props[key].enum);
        } else if (type === 'string') {
          field = z.string();
        } else if (type === 'number' || type === 'integer') {
          field = z.number();
        } else if (type === 'boolean') {
          field = z.boolean();
        } else if (type === 'array') {
          field = z.array(z.any());
        }

        if (props[key].description) {
          field = field.describe(props[key].description);
        }

        schemaShape[key] = required.includes(key) ? field : field.optional();
      });

      return new DynamicStructuredTool({
        name: def.executionKey,
        description: schema.description,
        schema: z.object(schemaShape),
        func: async (args) => {
          process.stdout.write(`\n[LangChain → Tool] Calling: ${def.label} (${def.executionKey})... `);
          
          if (def.nodeId) {
            await context.logNodeStatus(def.nodeId, 'running');
          }

          try {
            // Priority: args from LLM, then static config from node
            const mergedConfig = { 
              ...def.config, 
              ...args, 
              credentialId: def.config.credentialId || context.config.credentialId 
            };
            
            // Resolve node-specific credentials if available
            let toolCredentials = null;
            const credId = mergedConfig.credentialId;
            if (credId) {
              const res = await resolveCredential(credId, context.userId);
              toolCredentials = res.data;
            }
            
            const result = await handler({ 
              ...context, 
              config: mergedConfig, 
              credentials: toolCredentials,
              incomingData: {} 
            });

            if (def.nodeId) {
              await context.logNodeStatus(def.nodeId, 'completed', result);
            }

            console.log(`Done ✅`);
            return JSON.stringify(result);
          } catch (err: any) {
            if (def.nodeId) {
              await context.logNodeStatus(def.nodeId, 'failed', { error: err.message });
            }
            console.log(`Failed ❌`);
            console.error(`[Tool Error]:`, err.message);
            return JSON.stringify({ error: err.message, status: 'failed' });
          }
        }
      });
    })
    .filter(t => t !== null);
}
