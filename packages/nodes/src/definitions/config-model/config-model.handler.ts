import type { ToolHandler, ToolContext } from '../../types.js';

export const configModelHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config } = ctx;
  if (!config.credentialId) {
    return { error: 'No credential selected.', status: 'failed' };
  }
  return { 
    model: config.model, 
    temperature: parseFloat(config.temperature || '0.7'),
    maxTokens:   parseInt(config.maxTokens || '4096', 10),
    credentialId: config.credentialId,
    _type: 'model_config'
  };
};
