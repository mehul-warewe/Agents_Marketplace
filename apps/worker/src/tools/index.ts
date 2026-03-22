import { ToolHandler } from './types.js';
import { triggerManual, triggerChat } from './triggers.js';
import { synthesis } from './synthesis.js';
import { configModel } from './config_model.js';
import { configOutputParser } from './config_output_parser.js';
import { logicIf } from './logic.js';
import { dataEdit, mongodbAtlas, redis } from './data.js';
import {
  // Service routers (used by current 4-node design)
  googleGmail, googleDrive, googleCalendar, googleSheets,
  // Individual handlers (kept for legacy support + agentic direct-call)
  googleGmailSend, googleGmailSearch, googleGmailGet, googleGmailReply,
  googleGmailMarkRead, googleGmailDelete,
  googleDriveUpload, googleDriveList, googleDriveGetContent,
  googleDriveDelete, googleDriveCreateFolder, googleDriveShare,
  googleCalendarCreate, googleCalendarList, googleCalendarGet,
  googleCalendarUpdate, googleCalendarDelete,
  googleSheetsAppend, googleSheetsRead, googleSheetsUpdate,
  googleSheetsClear, googleSheetsCreate,

  // YouTube
  googleYoutube, googleYoutubeChannelStats, googleYoutubeListVideos, 
  googleYoutubeVideoStats, googleYoutubeAnalytics,
} from './google.js';

export * from './types.js';

export const WORKER_TOOLS: Record<string, ToolHandler> = {
  'trigger_manual': triggerManual,
  'trigger_chat':   triggerChat,
  'synthesis':      synthesis,
  'config_model':   configModel,
  'config_output_parser': configOutputParser,

  // Service routers — 4-node design (operation selected in config)
  'google_gmail':     googleGmail,
  'google_drive':     googleDrive,
  'google_calendar':  googleCalendar,
  'google_sheets':    googleSheets,

  // Individual operation keys — legacy + agentic direct-call
  'google_gmail_send':      googleGmailSend,
  'google_gmail_search':    googleGmailSearch,
  'google_gmail_get':       googleGmailGet,
  'google_gmail_reply':     googleGmailReply,
  'google_gmail_mark_read': googleGmailMarkRead,
  'google_gmail_delete':    googleGmailDelete,

  // Google Drive
  'google_drive_upload':        googleDriveUpload,
  'google_drive_list':          googleDriveList,
  'google_drive_get_content':   googleDriveGetContent,
  'google_drive_delete':        googleDriveDelete,
  'google_drive_create_folder': googleDriveCreateFolder,
  'google_drive_share':         googleDriveShare,

  // Google Calendar
  'google_calendar_create': googleCalendarCreate,
  'google_calendar_list':   googleCalendarList,
  'google_calendar_get':    googleCalendarGet,
  'google_calendar_update': googleCalendarUpdate,
  'google_calendar_delete': googleCalendarDelete,

  // Google Sheets
  'google_sheets_append': googleSheetsAppend,
  'google_sheets_read':   googleSheetsRead,
  'google_sheets_update': googleSheetsUpdate,
  'google_sheets_clear':  googleSheetsClear,
  'google_sheets_create': googleSheetsCreate,

  // Google YouTube
  'google_youtube':             googleYoutube,
  'google_youtube_channel_stats': googleYoutubeChannelStats,
  'google_youtube_list_my_vids': googleYoutubeListVideos,
  'google_youtube_video_stats':  googleYoutubeVideoStats,
  'google_youtube_analytics':    googleYoutubeAnalytics,
  
  // Logic & Data
  'logic_if':   logicIf,
  'data_edit':  dataEdit,

  // Legacy support
  'start':   triggerManual,
  'trigger': triggerManual,
};
