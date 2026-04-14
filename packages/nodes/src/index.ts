export type { NodeDefinition, NodeSocket, ConfigField, ConfigFieldType, NodeCategory, SocketType, SocketPosition, ToolContext, ToolHandler } from './types.js';

// ─── CORE NODES (Hand-written, maintained by us) ──────────────────────────
import { manualTrigger } from './definitions/manual-trigger/manual-trigger.js';
import { chatTrigger } from './definitions/chat-trigger/chat-trigger.js';
import { webhookTrigger } from './definitions/webhook-trigger/webhook-trigger.js';

import { openaiNode } from './definitions/openai/openai.js';
import { geminiNode } from './definitions/gemini/gemini.js';
import { claudeNode } from './definitions/claude/claude.js';
import { openrouterNode } from './definitions/openrouter/openrouter.js';

import { ifNode } from './definitions/if/if.js';
import { codeNode } from './definitions/code/code.js';

import { stickyNoteNode } from './definitions/sticky-note/sticky-note.js';
import { structuredOutputParserNode } from './definitions/structured-output-parser/structured-output-parser.js';
import { skillOutputNode } from './definitions/skill-output/skill-output.js';
import { skillInputNode } from './definitions/skill-input/skill-input.js';

// ─── DYNAMIC INTEGRATIONS (3,000+ platforms via Pipedream) ───────────────
import { pipedreamActionNode } from './definitions/pipedream/pipedream.js';
export { pipedreamActionNode };

import type { NodeDefinition } from './types.js';

/**
 * NODE_REGISTRY: Single source of truth for all node definitions
 */
export const NODE_REGISTRY: NodeDefinition[] = [
  // ─── TRIGGERS (Workflow Entry Points) ──────────────────────────────────
  manualTrigger,
  chatTrigger,
  webhookTrigger,
  skillInputNode,

  // ─── AI MODELS (LLM Runners) ──────────────────────────────────────────
  geminiNode,
  openaiNode,
  claudeNode,
  openrouterNode,

  // ─── LOGIC & FLOW CONTROL ─────────────────────────────────────────────
  ifNode,
  codeNode,

  // ─── PIPEDREAM INTEGRATIONS (Dynamic platforms) ────────────────────────
  pipedreamActionNode,

  // ─── UI & HELPERS ─────────────────────────────────────────────────────
  stickyNoteNode,
  structuredOutputParserNode,
  skillOutputNode,
];

export const EXECUTION_KEYS: Set<string> = new Set(
  NODE_REGISTRY.map((n) => n.executionKey),
);
