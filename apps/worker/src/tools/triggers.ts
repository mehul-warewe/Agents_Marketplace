import { ToolContext } from './types.js';

export async function triggerManual(context: ToolContext) {
  const { config, incomingData, ctx, render } = context;
  const nodeObj = config.objective ? render(config.objective) : '';
  const obj = nodeObj || incomingData.objective || ctx.objective || 'No objective set.';
  
  // Set the global objective in context
  ctx.objective = obj;
  
  return { 
    objective: obj, 
    trigger_type: 'manual',
    trigger_output: 'Pulse Initialized via Manual Trigger.' 
  };
}

export async function triggerChat(context: ToolContext) {
  const { config, incomingData, ctx, render } = context;
  
  // Chat trigger usually starts with a message from the user
  const message = incomingData.message || incomingData.user_message || config.testMessage || config.placeholder || '';
  const obj = message || config.objective || ctx.objective || 'Chat session started.';
  
  ctx.objective = obj;
  
  return {
    message,
    objective: obj,
    trigger_type: 'chat',
    trigger_output: `Pulse Initialized via Chat: ${message.substring(0, 50)}...`
  };
}
