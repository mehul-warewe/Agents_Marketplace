import { NODE_REGISTRY } from '@repo/nodes';
import type { ToolHandler } from '../tools/types.js';
import * as gmail from './google/gmail.js';
import { triggerManual, triggerChat, triggerWebhook } from './triggers/index.js';
import { synthesis } from '../tools/synthesis.js';
import { configModel } from '../tools/config_model.js';
import { configOutputParser } from './ai/output_parser.js';
import { logicIf } from '../tools/logic.js';
import { dataEdit, mongodbAtlas, redis } from '../tools/data.js';
import * as googleLegacy from '../tools/google.js';
import { memory_buffer, memory_mongodb, memory_redis } from './ai/memory.js';
import { agentCaller } from '../tools/agent_caller.js';
import { logicCode } from '../tools/logic_code.js';

// Shared handler for all MCP platforms
const platformMcpHandler: ToolHandler = async (ctx) => {
  return { status: "ready", platform: ctx.config.platform };
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

  // ── Legacy aliases ───────────────────────────────────────────────────────────
  'start': triggerManual,
};

/**
 * Startup validation: warn if any executionKey in the shared NODE_REGISTRY
 * does not have a corresponding handler in WORKER_NODES.
 *
 * This catches mismatches the moment the worker boots — no more silent
 * "node runs but does nothing" bugs.
 */
const uniqueRegistryKeys = [...new Set(NODE_REGISTRY.map((n) => n.executionKey))];
const missingHandlers = uniqueRegistryKeys.filter((key) => !(key in WORKER_NODES));
if (missingHandlers.length > 0) {
  console.warn(
    `[nodes/index] WARNING: The following executionKeys are defined in @repo/nodes` +
    ` but have no handler in WORKER_NODES:\n  ${missingHandlers.join(', ')}`,
  );
}
