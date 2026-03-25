import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { ToolContext } from '../types.js';

/**
 * Shared utility for calling MCP-based tools.
 * Allows individual handlers to share core logic while maintaining separate entry points.
 */
export async function callMcpTool(ctx: ToolContext, toolName: string, arguments_?: Record<string, any>) {
  const { config, credentials } = ctx;
  const mcpUrl = config.mcpUrl || 'http://localhost:3000/sse';
  const platform = ctx.label || 'Unknown';

  const token = credentials?.accessToken || credentials?.apiKey || credentials?.botToken;
  if (!token) throw new Error(`[${platform}] Missing credentials. Please select your account in the node's "Settings" tab within the Builder.`);

  const transport = new SSEClientTransport(new URL(mcpUrl), {
    eventSourceInit: { headers: { 'Authorization': `Bearer ${token}` } } as any
  });
  const client = new Client({ name: "AetherWorker", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    const result = await client.callTool({ name: toolName, arguments: arguments_ || {} });
    await client.close();
    return result;
  } catch (err: any) {
    throw new Error(`[${platform} MCP Error] ${err.message}`);
  }
}
