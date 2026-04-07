/**
 * NODE HANDLERS REGISTRATION
 *
 * Architecture:
 *   ✓ CORE HANDLERS: Triggers, Logic, LLMs (maintained by us)
 *   ✓ INDIVIDUAL PIPEDREAM HANDLERS: Each platform has its own handler
 *       └─ Each handler validates platform-specific config
 *       └─ All delegate to universal pipedreamHandler
 *   ✓ UNIVERSAL PIPEDREAM HANDLER: Manages MCP execution
 *
 * Handler Pattern:
 *   Individual Handler (e.g., slackPostMessage)
 *     ├─ Validates config (channel, text required)
 *     ├─ Checks credential exists
 *     └─ Calls pipedreamHandler() with appSlug + actionName
 */

import { ToolHandler } from './types.js';

// ─── TRIGGERS ──────────────────────────────────────────────────────────
export * from './definitions/manual-trigger/manual-trigger.handler.js';
export * from './definitions/chat-trigger/chat-trigger.handler.js';
export * from './definitions/webhook-trigger/webhook-trigger.handler.js';

// ─── AI MODELS ─────────────────────────────────────────────────────────
export * from './definitions/openai/openai.handler.js';
export * from './definitions/claude/claude.handler.js';
export * from './definitions/gemini/gemini.handler.js';
export * from './definitions/openrouter/openrouter.handler.js';

// Worker Compatibility Handlers (for synthesis/config)
export { llmActionHandler as synthesisHandler } from './definitions/llm-action/llm-action.handler.js';
export { llmActionHandler as configModelHandler } from './definitions/llm-action/llm-action.handler.js';
export const configOutputParserHandler: any = async () => ({ status: 'completed' });

// ─── LOGIC & FLOW CONTROL ────────────────────────────────────────────
export * from './definitions/if/if.handler.js';
export * from './definitions/code/code.handler.js';

// ─── PIPEDREAM INTEGRATION HANDERS ────────────────────────────────────
// Generic handler for all Pipedream platforms (dynamic action execution)
export { pipedreamActionHandler } from './definitions/pipedream/pipedream-action.handler.js';

// ─── UI & HELPERS ──────────────────────────────────────────────────────
export * from './definitions/sticky-note/sticky-note.handler.js';

// ─── IMPORTS FOR WORKER_NODES REGISTRATION ─────────────────────────────
import { manualTriggerHandler } from './definitions/manual-trigger/manual-trigger.handler.js';
import { chatTriggerHandler } from './definitions/chat-trigger/chat-trigger.handler.js';
import { webhookTriggerHandler } from './definitions/webhook-trigger/webhook-trigger.handler.js';
import { openaiHandler } from './definitions/openai/openai.handler.js';
import { claudeHandler } from './definitions/claude/claude.handler.js';
import { geminiHandler } from './definitions/gemini/gemini.handler.js';
import { openrouterHandler } from './definitions/openrouter/openrouter.handler.js';
import { llmActionHandler } from './definitions/llm-action/llm-action.handler.js';
import { ifHandler } from './definitions/if/if.handler.js';
import { codeHandler } from './definitions/code/code.handler.js';
import { pipedreamActionHandler } from './definitions/pipedream/pipedream-action.handler.js';
import { stickyNoteHandler } from './definitions/sticky-note/sticky-note.handler.js';

/**
 * WORKER_NODES: Maps executionKey → handler function
 * Used by worker to find the handler for each node type
 */
export const WORKER_NODES: Record<string, ToolHandler> = {
  // ─── TRIGGERS
  'trigger_manual': manualTriggerHandler,
  'trigger_chat': chatTriggerHandler,
  'trigger_webhook': webhookTriggerHandler,
  'start': manualTriggerHandler, // Legacy alias

  // ─── AI MODELS
  'llm_run': openaiHandler,
  'openai_run': openaiHandler,
  'claude_run': claudeHandler,
  'gemini_run': geminiHandler,
  'openrouter_run': openrouterHandler,
  'synthesis': llmActionHandler,
  'config_model': llmActionHandler,
  'config_output_parser': configOutputParserHandler,

  // ─── LOGIC
  'logic_if': ifHandler,
  'logic_code': codeHandler,

  // ─── PIPEDREAM INTEGRATIONS
  // Generic handler for all Pipedream platforms (handles all 10,000+ actions dynamically)
  'pipedream_action': pipedreamActionHandler,

  // Specific handles are now unified into the Pipedream Action Handler
  // (Inferred dynamically from the execution key if not explicitly set)
  'slack_post_message': pipedreamActionHandler,
  'slack_send_dm': pipedreamActionHandler,

  'discord_send_message': pipedreamActionHandler,
  'discord_send_dm': pipedreamActionHandler,

  'github_create_issue': pipedreamActionHandler,
  'github_create_pr': pipedreamActionHandler,

  'stripe_create_charge': pipedreamActionHandler,
  'stripe_create_customer': pipedreamActionHandler,

  'google_sheets_append_row': pipedreamActionHandler,
  'google_sheets_get_values': pipedreamActionHandler,

  // ─── UI & HELPERS
  'sticky_note': stickyNoteHandler
};

// ─── REGISTRY VALIDATION ───────────────────────────────────────────────
// Validate all registry keys have handlers
import { NODE_REGISTRY } from './index.js';

const registryKeys = new Set(NODE_REGISTRY.filter(n => !n.isDecorative).map(n => n.executionKey));
const handlerKeys = new Set(Object.keys(WORKER_NODES));
const missing = Array.from(registryKeys).filter(k => !handlerKeys.has(k));

if (missing.length > 0) {
  console.warn(
    `[Node Registry] Warning: Missing handlers for execution keys: ${missing.join(', ')}`
  );
}
