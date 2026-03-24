import type { ToolHandler, ToolContext } from '../../types.js';

export const webhookTriggerHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, incomingData } = ctx;
  return {
    ...incomingData,
    _webhook: {
      path: config.path,
      method: config.httpMethod || 'POST',
      responseCode: parseInt(config.responseCode || '200'),
      responseData: config.responseData,
    }
  };
};
