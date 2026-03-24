import { callMcpTool } from '../../utils/mcp.js';
import type { ToolHandler, ToolContext } from '../../types.js';

export const githubHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  const operation = config.operation;

  // We can add GitHub-specific pre-processing here if needed
  // For now, it delegates to the generic MCP caller but with a specific entry point
  const args = { ...config };
  delete args.operation;

  // Render all arguments
  Object.keys(args).forEach(key => {
    if (typeof args[key] === 'string') {
      args[key] = render(args[key]);
    }
  });

  return await callMcpTool(ctx, operation, args);
};
