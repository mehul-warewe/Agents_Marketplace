import { ToolHandler } from '../../tools/types.js';

export const triggerManual: ToolHandler = async ({ config, incomingData }) => {
  return { ...config, ...incomingData, source: 'manual', timestamp: new Date() };
};

export const triggerChat: ToolHandler = async ({ config, incomingData }) => {
  const message = incomingData.message || config.test_input || '';
  return { 
    message,
    input: message,
    source: 'chat',
    timestamp: new Date(),
  };
};

export const triggerWebhook: ToolHandler = async ({ config, incomingData }) => {
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
