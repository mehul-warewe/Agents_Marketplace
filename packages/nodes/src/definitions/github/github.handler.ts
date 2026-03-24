import { callMcpTool } from '../../utils/mcp.js';
import type { ToolHandler, ToolContext } from '../../types.js';

export const githubHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  const operation = config.operation;

  // Map internal operation keys to standard MCP tool names
  const toolMapping: Record<string, string> = {
    'list':   'list_repo_issues',
    'get':    'get_issue',
    'create': 'create_issue',
    'update': 'update_issue',
  };

  const toolName = toolMapping[operation] || operation;

  // We can add GitHub-specific pre-processing here if needed
  const args = { ...config };
  delete args.operation;

  // Render all arguments
  Object.keys(args).forEach(key => {
    if (typeof args[key] === 'string') {
      args[key] = render(args[key]);
    }
  });

  return await callMcpTool(ctx, toolName, args);
};
