import type { ToolHandler, ToolContext } from '../../types.js';

export const chatTriggerHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, incomingData } = ctx;
  const message = incomingData.message || config.test_input || '';
  return { 
    message,
    input: message,
    source: 'chat',
    timestamp: new Date(),
  };
};
