import { ToolHandler } from '../../types.js';

/**
 * Split Branch Handler
 * 
 * Simple passthrough that duplicates incoming data to multiple outputs.
 * The flow engine automatically broadcasts the returned results to all
 * connected downstream nodes if no _activeHandle is specified.
 */
export const branchHandler: ToolHandler = async (ctx) => {
  return {
    ...ctx.incomingData,
    status: 'completed'
  };
};
