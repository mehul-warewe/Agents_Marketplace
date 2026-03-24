import type { ToolHandler, ToolContext } from '../../types.js';

export const manualTriggerHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, incomingData } = ctx;
  return { ...config, ...incomingData, source: 'manual', timestamp: new Date() };
};
