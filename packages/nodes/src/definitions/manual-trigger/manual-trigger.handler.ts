import type { ToolHandler, ToolContext } from '../../types.js';

export const manualTriggerHandler: ToolHandler = async (ctx: ToolContext) => {
  const { incomingData } = ctx;
  // Create a clean result object
  const result: Record<string, any> = { 
    timestamp: new Date().toISOString() 
  };
  
  // Only merge incoming data if it's not the default trigger signal we stripped earlier
  if (incomingData && Object.keys(incomingData).length > 0) {
    Object.assign(result, incomingData);
  }

  // Ensure internal metadata fields from node config don't leak out
  delete result.credentialId;
  delete result.source;
  delete result.trigger_output;
  delete result.operation;

  return result;
};
