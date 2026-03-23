import { NODE_REGISTRY } from '@repo/nodes';
import type { ToolHandler } from '../tools/types.js';
import { triggerManual, triggerChat, triggerWebhook } from './triggers/index.js';
import { synthesis } from '../tools/synthesis.js';
import { configModel } from '../tools/config_model.js';
import { configOutputParser } from './ai/output_parser.js';
import { logicIf } from '../tools/logic.js';
import { dataEdit, mongodbAtlas, redis } from '../tools/data.js';
import { memory_buffer, memory_mongodb, memory_redis } from './ai/memory.js';
import { agentCaller } from '../tools/agent_caller.js';
import { logicCode } from '../tools/logic_code.js';
import { 
  googleGmail, googleDrive, googleCalendar, googleSheets, 
  googleYoutube 
} from '../tools/google.js';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Shared handler for all MCP platforms (GitHub, Slack, etc.)
const platformMcpHandler: ToolHandler = async (ctx) => {
  const { config, credentials } = ctx;
  const mcpUrl = config.mcpUrl || 'http://localhost:3000/sse';
  const platform = config.platform;
  const resource = config.resource;
  const operation = config.operation;

  // Real enforcement: If no credential, fail the node
  const token = credentials?.accessToken || credentials?.apiKey || credentials?.botToken;
  console.log(`[MCP] Checking credentials for ${platform}... Found token: ${!!token}`);

  if (!token) {
    console.error(`[MCP] FAILURE: No credentials provided for ${platform} node.`);
    return { error: `Missing credentials for ${platform}. Please connect an account in the node settings.`, status: "failed" };
  }
  
  // The AI provides operation-specific fields in the config
  const args = { ...config };
  delete args.mcpUrl;
  delete args.platform;
  delete args.resource;
  delete args.operation;
  delete args.accessToken;

  console.log(`[MCP] Connecting to ${platform} server at ${mcpUrl}...`);

  const transport = new SSEClientTransport(new URL(mcpUrl), {
    eventSourceInit: {
      headers: {
        'Authorization': `Bearer ${credentials?.accessToken || credentials?.apiKey || credentials?.botToken || ''}`
      }
    } as any
  });

  const client = new Client({ name: "AetherWorker", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    
    // Map resource + operation to a tool name
    // Example: operation="list_issues", resource="repository" -> "list_issues" (usually)
    // Most MCP servers keep the names simple.
    const toolName = operation || `${operation}_${resource}`;
    
    console.log(`[MCP] Calling tool: ${toolName} with args:`, args);
    
    const result = await client.callTool({
      name: toolName,
      arguments: args
    });

    await client.close();
    return result;
  } catch (err: any) {
    console.error(`[MCP Error] ${platform} failed:`, err.message);
    return { error: err.message, status: "failed" };
  }
};

export const WORKER_NODES: Record<string, ToolHandler> = {
  // ── Triggers ────────────────────────────────────────────────────────────────
  'trigger_manual': triggerManual,
  'trigger_chat':   triggerChat,
  'trigger_webhook': triggerWebhook,

  // ── AI ──────────────────────────────────────────────────────────────────────
  'synthesis':            synthesis,
  'config_model':         configModel,
  'config_output_parser': configOutputParser,
  'memory_buffer':        memory_buffer,
  'memory_mongodb':       memory_mongodb,
  'memory_redis':         memory_redis,

  // ── Logic ───────────────────────────────────────────────────────────────────
  'logic_if':          logicIf,
  'tool_agent_caller': agentCaller,
  'logic_code':        logicCode,

  // ── MCP Platforms ─────────────────────────────────────────────────────────
  'platform_mcp_handler': platformMcpHandler,

  // ── Data ────────────────────────────────────────────────────────────────────
  'data_edit':     dataEdit,
  'mongodb_atlas': mongodbAtlas,
  'redis':         redis,

  // ── Google & YouTube (Real Handlers) ─────────────────────────────────────────
  'google_gmail':    googleGmail,
  'google_drive':    googleDrive,
  'google_calendar': googleCalendar,
  'google_sheets':   googleSheets,
  'google_youtube':  googleYoutube,

  // ── Legacy aliases ───────────────────────────────────────────────────────────
  'start': triggerManual,
};

const uniqueRegistryKeys = [...new Set(NODE_REGISTRY.map((n) => n.executionKey))];
const missingHandlers = uniqueRegistryKeys.filter((key) => !(key in WORKER_NODES));
if (missingHandlers.length > 0) {
  console.warn(
    `[nodes/index] WARNING: The following executionKeys are defined in @repo/nodes` +
    ` but have no handler in WORKER_NODES:\n  ${missingHandlers.join(', ')}`,
  );
}
