import { callMcpTool } from '../../utils/mcp.js';
import type { ToolHandler, ToolContext } from '../../types.js';

export const linearHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  const operation = config.operation;
  
  const args = { ...config };
  delete args.operation;

  Object.keys(args).forEach(key => {
    if (typeof args[key] === 'string') {
      args[key] = render(args[key]);
    }
  });

  return await callMcpTool(ctx, operation, args);
};
