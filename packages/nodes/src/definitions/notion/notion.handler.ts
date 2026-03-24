import { callMcpTool } from '../../utils/mcp.js';
import type { ToolHandler, ToolContext } from '../../types.js';

export const notionHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  const operation = config.operation;

  const toolMapping: Record<string, string> = {
    'search': 'search_pages',
    'create': 'create_page',
    'get':    'get_page',
    'update': 'update_page_properties',
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
