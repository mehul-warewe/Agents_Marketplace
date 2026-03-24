import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { ToolHandler, ToolContext } from '../types.js';

export const mcpHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, credentials } = ctx;
  const mcpUrl = config.mcpUrl || 'http://localhost:3000/sse';
  const platform = config.platform || ctx.label?.toLowerCase() || 'unknown';
  const operation = config.operation;

  const token = credentials?.accessToken || credentials?.apiKey || credentials?.botToken;
  if (!token) throw new Error(`Missing credentials for ${platform}.`);

  const args = { ...config };
  delete args.mcpUrl; delete args.platform; delete args.resource; delete args.operation;

  const transport = new SSEClientTransport(new URL(mcpUrl), {
    eventSourceInit: { headers: { 'Authorization': `Bearer ${token}` } } as any
  });
  const client = new Client({ name: "AetherWorker", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    const toolName = operation;
    const result = await client.callTool({ name: toolName, arguments: args });
    await client.close();
    return result;
  } catch (err: any) {
    throw new Error(`[MCP Error] ${platform} failed: ${err.message}`);
  }
};
