import { callMcpTool } from '../../utils/mcp.js';
import type { ToolHandler, ToolContext } from '../../types.js';

export const slackHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  const operation = config.operation;

  // Map internal operation names to MCP server tool names
  const toolMapping: Record<string, string> = {
    'post': 'post_message',
    'list': 'list_channels',
    'info': 'get_channel_info',
  };

  const toolName = toolMapping[operation] || operation;
  
  const args = { ...config };
  delete args.operation;

  Object.keys(args).forEach(key => {
    if (typeof args[key] === 'string') {
      args[key] = render(args[key]);
    }
  });

  return await callMcpTool(ctx, toolName, args);
};
