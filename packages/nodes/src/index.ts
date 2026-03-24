export type { NodeDefinition, NodeSocket, ConfigField, ConfigFieldType, NodeCategory, SocketType, SocketPosition, ToolContext, ToolHandler } from './types.js';

import { manualTrigger } from './definitions/manual-trigger/manual-trigger.js';
import { chatTrigger } from './definitions/chat-trigger/chat-trigger.js';
import { webhookTrigger } from './definitions/webhook-trigger/webhook-trigger.js';

import { aiAgentNode } from './definitions/ai-agent/ai-agent.js';

import { openaiNode } from './definitions/openai/openai.js';
import { geminiNode } from './definitions/gemini/gemini.js';
import { claudeNode } from './definitions/claude/claude.js';
import { openrouterNode } from './definitions/openrouter/openrouter.js';

import { gmailNode } from './definitions/gmail/gmail.js';
import { driveNode } from './definitions/drive/drive.js';
import { calendarNode } from './definitions/calendar/calendar.js';
import { sheetsNode } from './definitions/sheets/sheets.js';
import { youtubeNode } from './definitions/youtube/youtube.js';

import { ifNode } from './definitions/if/if.js';
import { codeNode } from './definitions/code/code.js';

import { mongodbNode } from './definitions/mongodb/mongodb.js';
import { redisNode } from './definitions/redis/redis.js';

import { githubNode } from './definitions/github/github.js';
import { slackNode } from './definitions/slack/slack.js';
import { linearNode } from './definitions/linear/linear.js';
import { notionNode } from './definitions/notion/notion.js';
import { supabaseNode } from './definitions/supabase/supabase.js';

import { structuredOutputParserNode } from './definitions/structured-output-parser/structured-output-parser.js';

import type { NodeDefinition } from './types.js';

/**
 * The single source of truth for all node definitions.
 * Both the frontend (toolRegistry) and the worker (nodes/index) reference this.
 */
export const NODE_REGISTRY: NodeDefinition[] = [
  // Triggers
  manualTrigger,
  chatTrigger,
  webhookTrigger,

  // AI
  aiAgentNode,

  // Models
  openaiNode,
  geminiNode,
  claudeNode,
  openrouterNode,

  // Google & YouTube
  gmailNode,
  driveNode,
  calendarNode,
  sheetsNode,
  youtubeNode,

  // Logic
  ifNode,
  codeNode,

  // Databases
  mongodbNode,
  redisNode,

  // MCP Platforms
  githubNode,
  slackNode,
  linearNode,
  notionNode,
  supabaseNode,

  // Output
  structuredOutputParserNode,
];

/** All unique executionKeys in the registry (used for worker validation). */
export const EXECUTION_KEYS: Set<string> = new Set(
  NODE_REGISTRY.map((n) => n.executionKey),
);
