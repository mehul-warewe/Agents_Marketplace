import { ToolContext } from './types.js';

export async function configModel(context: ToolContext) {
  const { config } = context;
  
  if (!config.credentialId) {
    return { error: 'No credential selected. Please connect an account in the model settings.', status: 'failed' };
  }
  
  return { 
    model: config.model, 
    temperature: parseFloat(config.temperature || '0.7'),
    maxTokens:   parseInt(config.maxTokens || '4096', 10),
    credentialId: config.credentialId,
    _type: 'model_config'
  };
}
