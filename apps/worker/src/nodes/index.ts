import { NODE_REGISTRY, type ToolHandler, type ToolContext } from '@repo/nodes';
import { 
  // Triggers
  manualTriggerHandler, chatTriggerHandler, webhookTriggerHandler,
  // AI
  synthesisHandler, configModelHandler, configOutputParserHandler,
  // Logic
  ifHandler, codeHandler,
  // Databases
  mongodbAtlasHandler, redisHandler,
  // Google
  gmailHandler, driveHandler, calendarHandler, sheetsHandler, youtubeHandler,
  // MCP Platforms (Specialized)
  githubHandler, slackHandler, linearHandler, notionHandler, supabaseHandler,
  stickyNoteHandler, mcpHandler
} from '@repo/nodes/handlers';

export const WORKER_NODES: Record<string, ToolHandler> = {
  // Triggers
  'trigger_manual': manualTriggerHandler,
  'trigger_chat':   chatTriggerHandler,
  'trigger_webhook': webhookTriggerHandler,
  'start':           manualTriggerHandler, // Legacy alias

  // AI & Models
  'synthesis':            synthesisHandler,
  'llm_run':              synthesisHandler, // Unified runner for direct LLM calls
  'config_model':         configModelHandler,
  'config_output_parser': configOutputParserHandler,

  // Logic
  'logic_if':          ifHandler,
  'logic_code':        codeHandler,

  // Databases & Data
  'mongodb_atlas': mongodbAtlasHandler,
  'redis':         redisHandler,

  // Google
  'google_gmail':    gmailHandler,
  'google_drive':    driveHandler,
  'google_calendar': calendarHandler,
  'google_sheets':   sheetsHandler,
  'google_youtube':  youtubeHandler,

  // MCP Platforms (Specialized)
  'github_mcp':      githubHandler,
  'slack_mcp':       slackHandler,
  'linear_mcp':      linearHandler,
  'notion_mcp':      notionHandler,
  'supabase_mcp':    supabaseHandler,
  'sticky_note':     stickyNoteHandler,

  // Legacy / Generic MCP support - Backwards Compatibility
  'platform_mcp_handler': mcpHandler,
};

// Log warning if any registry keys are missing handlers
const registryKeys = Array.from(new Set(NODE_REGISTRY.map(n => n.executionKey)));
const missing = registryKeys.filter(k => !(k in WORKER_NODES));
if (missing.length > 0) {
  console.warn(`[Node Registry] Warning: Missing handlers for: ${missing.join(', ')}`);
}
