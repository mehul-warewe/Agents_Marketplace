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

  // ── Google (modular routers) ─────────────────────────────────────────────────
  'google_gmail':     gmail.handler,
  'google_drive':     googleLegacy.googleDrive,
  'google_calendar':  googleLegacy.googleCalendar,
  'google_sheets':    googleLegacy.googleSheets,
  'google_youtube':   googleLegacy.googleYoutube,

  // ── Google (individual agentic sub-operations) ───────────────────────────────
  'google_gmail_send':      googleLegacy.googleGmailSend,
  'google_gmail_search':    googleLegacy.googleGmailSearch,
  'google_gmail_get':       googleLegacy.googleGmailGet,
  'google_gmail_reply':     googleLegacy.googleGmailReply,
  'google_gmail_mark_read': googleLegacy.googleGmailMarkRead,
  'google_gmail_delete':    googleLegacy.googleGmailDelete,

  'google_drive_upload':        googleLegacy.googleDriveUpload,
  'google_drive_list':          googleLegacy.googleDriveList,
  'google_drive_get_content':   googleLegacy.googleDriveGetContent,
  'google_drive_delete':        googleLegacy.googleDriveDelete,
  'google_drive_create_folder': googleLegacy.googleDriveCreateFolder,
  'google_drive_share':         googleLegacy.googleDriveShare,

  'google_calendar_create': googleLegacy.googleCalendarCreate,
  'google_calendar_list':   googleLegacy.googleCalendarList,
  'google_calendar_get':    googleLegacy.googleCalendarGet,
  'google_calendar_update': googleLegacy.googleCalendarUpdate,
  'google_calendar_delete': googleLegacy.googleCalendarDelete,

  'google_sheets_append': googleLegacy.googleSheetsAppend,
  'google_sheets_read':   googleLegacy.googleSheetsRead,
  'google_sheets_update': googleLegacy.googleSheetsUpdate,
  'google_sheets_clear':  googleLegacy.googleSheetsClear,
  'google_sheets_create': googleLegacy.googleSheetsCreate,

  'google_youtube_channel_stats': googleLegacy.googleYoutubeChannelStats,
  'google_youtube_list_my_vids':  googleLegacy.googleYoutubeListVideos,
  'google_youtube_video_stats':   googleLegacy.googleYoutubeVideoStats,
  'google_youtube_analytics':     googleLegacy.googleYoutubeAnalytics,

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
