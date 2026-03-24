/**
 * OpenAI-compatible function schemas for each worker tool.
 * Used by synthesis.ts when the Agent runs in agentic (LLM tool-calling) mode.
 *
 * The 4 consolidated service routers (google_gmail, google_drive, etc.) are defined
 * first — the LLM picks the operation as a parameter.  The individual operation
 * schemas below are kept for legacy / direct agentic use.
 */
export const TOOL_SCHEMAS: Record<string, { name: string; description: string; parameters: any }> = {

  // ── Consolidated service routers ──────────────────────────────────────────
  google_gmail: {
    name: 'gmail',
    description: 'Interact with Gmail. Operations: send (send email), search (search/list emails), get (read email by ID), reply (reply to thread), mark_read (mark read/unread), delete (trash email).',
    parameters: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['send', 'search', 'get', 'reply', 'mark_read', 'delete'], description: 'Which Gmail action to perform' },
        to:         { type: 'string', description: '[send] Recipient email address' },
        subject:    { type: 'string', description: '[send] Email subject line' },
        body:       { type: 'string', description: '[send, reply] Email / reply body (HTML ok)' },
        query:      { type: 'string', description: '[search] Gmail search query, e.g. "from:x@y.com is:unread"' },
        maxResults: { type: 'number', description: '[search] Max emails to return (default 10)' },
        messageId:  { type: 'string', description: '[get, reply, mark_read, delete] Gmail message ID' },
        markAs:     { type: 'string', enum: ['read', 'unread'], description: '[mark_read] Target state' },
      },
      required: ['operation'],
    },
  },

  google_drive: {
    name: 'google_drive',
    description: 'Interact with Google Drive. Operations: upload (create text file), list (list/search files), get_content (read file text), delete (delete file), create_folder (create folder), share (share file/folder).',
    parameters: {
      type: 'object',
      properties: {
        operation:    { type: 'string', enum: ['upload', 'list', 'get_content', 'delete', 'create_folder', 'share'], description: 'Which Drive action to perform' },
        fileName:     { type: 'string', description: '[upload] File name with extension' },
        content:      { type: 'string', description: '[upload] Text content of the file' },
        folderId:     { type: 'string', description: '[upload, list] Target or filter folder ID' },
        query:        { type: 'string', description: '[list] Drive search query' },
        maxResults:   { type: 'number', description: '[list] Max files to return (default 20)' },
        fileId:       { type: 'string', description: '[get_content, delete, share] File/folder ID' },
        folderName:   { type: 'string', description: '[create_folder] Name of new folder' },
        parentId:     { type: 'string', description: '[create_folder] Optional parent folder ID' },
        emailAddress: { type: 'string', description: '[share] Email to share with (empty = public)' },
        role:         { type: 'string', enum: ['reader', 'writer', 'commenter'], description: '[share] Permission level' },
      },
      required: ['operation'],
    },
  },

  google_calendar: {
    name: 'google_calendar',
    description: 'Interact with Google Calendar. Operations: create (create event), list (list events), get (get event by ID), update (update event), delete (delete event).',
    parameters: {
      type: 'object',
      properties: {
        operation:   { type: 'string', enum: ['create', 'list', 'get', 'update', 'delete'], description: 'Which Calendar action to perform' },
        summary:     { type: 'string', description: '[create, update] Event title' },
        description: { type: 'string', description: '[create, update] Event description' },
        startTime:   { type: 'string', description: '[create, update] ISO 8601 start time, e.g. 2024-03-20T10:00:00Z' },
        endTime:     { type: 'string', description: '[create, update] ISO 8601 end time' },
        location:    { type: 'string', description: '[create, update] Physical or virtual location' },
        attendees:   { type: 'string', description: '[create, update] Comma-separated attendee emails' },
        timeMin:     { type: 'string', description: '[list] Start of range ISO 8601 (default: now)' },
        timeMax:     { type: 'string', description: '[list] End of range ISO 8601' },
        maxResults:  { type: 'number', description: '[list] Max events to return (default 10)' },
        query:       { type: 'string', description: '[list] Free-text search filter' },
        eventId:     { type: 'string', description: '[get, update, delete] Event ID' },
      },
      required: ['operation'],
    },
  },

  google_sheets: {
    name: 'google_sheets',
    description: 'Interact with Google Sheets. Operations: append (add row), read (read range), update (overwrite range), clear (clear range), create (create spreadsheet).',
    parameters: {
      type: 'object',
      properties: {
        operation:     { type: 'string', enum: ['append', 'read', 'update', 'clear', 'create'], description: 'Which Sheets action to perform' },
        spreadsheetId: { type: 'string', description: '[append, read, update, clear] Spreadsheet ID from URL' },
        range:         { type: 'string', description: '[append, read, update, clear] Sheet/range e.g. Sheet1!A1:D10' },
        values:        { type: 'string', description: '[append, update] CSV or JSON array of values' },
        title:         { type: 'string', description: '[create] Title of new spreadsheet' },
      },
      required: ['operation'],
    },
  },
  
  google_youtube: {
    name: 'youtube',
    description: 'Interact with YouTube. Operations: channel_stats (get channel statistics), list_my_videos (search/list your videos), video_stats (get stats for a specific video), analytics (query channel reports).',
    parameters: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['channel_stats', 'list_my_videos', 'video_stats', 'analytics'], description: 'Which YouTube action to perform' },
        maxResults: { type: 'number', description: '[list_my_videos] Max videos to return' },
        videoId:    { type: 'string', description: '[video_stats] YouTube video ID or URL' },
        startDate:  { type: 'string', description: '[analytics] Start date (YYYY-MM-DD)' },
        endDate:    { type: 'string', description: '[analytics] End date (YYYY-MM-DD)' },
        metrics:    { type: 'string', description: '[analytics] Comma-separated metrics e.g. views,likes' },
        dimensions: { type: 'string', description: '[analytics] Report dimensions e.g. day,video' },
      },
      required: ['operation'],
    },
  },


  // ── Individual operation schemas (legacy / direct agentic) ────────────────
  // ── Gmail ─────────────────────────────────────────────────────────────────
  google_gmail_send: {
    name: 'send_email',
    description: 'Send a new email via Gmail.',
    parameters: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body:    { type: 'string', description: 'Email body (HTML supported)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },

  google_gmail_search: {
    name: 'search_emails',
    description: 'Search or list emails in Gmail. Returns subject, sender, date and snippet.',
    parameters: {
      type: 'object',
      properties: {
        query:      { type: 'string', description: 'Gmail search query (e.g. "from:john@example.com", "subject:invoice", "is:unread"). Leave empty to list recent emails.' },
        maxResults: { type: 'number', description: 'Maximum number of emails to return (default 10)' },
      },
      required: [],
    },
  },

  google_gmail_get: {
    name: 'get_email',
    description: 'Get the full content of a specific email by its message ID.',
    parameters: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'The Gmail message ID to retrieve' },
      },
      required: ['messageId'],
    },
  },

  google_gmail_reply: {
    name: 'reply_to_email',
    description: 'Reply to an existing email thread.',
    parameters: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'The message ID of the email to reply to' },
        body:      { type: 'string', description: 'Reply body content (HTML supported)' },
      },
      required: ['messageId', 'body'],
    },
  },

  google_gmail_mark_read: {
    name: 'mark_email_read',
    description: 'Mark an email as read or unread.',
    parameters: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'The Gmail message ID' },
        markAs:    { type: 'string', enum: ['read', 'unread'], description: 'Whether to mark as read or unread' },
      },
      required: ['messageId', 'markAs'],
    },
  },

  google_gmail_delete: {
    name: 'delete_email',
    description: 'Move an email to the Gmail trash.',
    parameters: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: 'The Gmail message ID to trash' },
      },
      required: ['messageId'],
    },
  },

  // ── Google Drive ──────────────────────────────────────────────────────────
  google_drive_upload: {
    name: 'upload_file_to_drive',
    description: 'Upload a text file to Google Drive.',
    parameters: {
      type: 'object',
      properties: {
        fileName: { type: 'string', description: 'File name with extension (e.g. report.txt)' },
        content:  { type: 'string', description: 'Text content to write into the file' },
        folderId: { type: 'string', description: 'Optional Google Drive folder ID to upload into' },
      },
      required: ['fileName', 'content'],
    },
  },

  google_drive_list: {
    name: 'list_drive_files',
    description: 'List files in Google Drive, optionally filtered by name or type.',
    parameters: {
      type: 'object',
      properties: {
        query:      { type: 'string', description: 'Drive query filter (e.g. "name contains \'report\'", "mimeType=\'application/pdf\'")' },
        folderId:   { type: 'string', description: 'Limit results to files inside this folder ID' },
        maxResults: { type: 'number', description: 'Maximum number of files to return (default 20)' },
      },
      required: [],
    },
  },

  google_drive_get_content: {
    name: 'get_drive_file_content',
    description: 'Download and return the text content of a file from Google Drive.',
    parameters: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'The Google Drive file ID' },
      },
      required: ['fileId'],
    },
  },

  google_drive_delete: {
    name: 'delete_drive_file',
    description: 'Permanently delete a file from Google Drive.',
    parameters: {
      type: 'object',
      properties: {
        fileId: { type: 'string', description: 'The Google Drive file ID to delete' },
      },
      required: ['fileId'],
    },
  },

  google_drive_create_folder: {
    name: 'create_drive_folder',
    description: 'Create a new folder in Google Drive.',
    parameters: {
      type: 'object',
      properties: {
        folderName: { type: 'string', description: 'Name of the folder to create' },
        parentId:   { type: 'string', description: 'Optional parent folder ID' },
      },
      required: ['folderName'],
    },
  },

  google_drive_share: {
    name: 'share_drive_file',
    description: 'Share a Google Drive file or folder with a user or make it public.',
    parameters: {
      type: 'object',
      properties: {
        fileId:       { type: 'string', description: 'The file or folder ID to share' },
        emailAddress: { type: 'string', description: 'Email address to share with. Leave empty to share with anyone.' },
        role:         { type: 'string', enum: ['reader', 'writer', 'commenter'], description: 'Permission level (default: reader)' },
      },
      required: ['fileId'],
    },
  },

  // ── Google Calendar ───────────────────────────────────────────────────────
  google_calendar_create: {
    name: 'create_calendar_event',
    description: 'Create a new event in Google Calendar.',
    parameters: {
      type: 'object',
      properties: {
        summary:     { type: 'string', description: 'Event title' },
        description: { type: 'string', description: 'Event description or agenda' },
        startTime:   { type: 'string', description: 'Start time in ISO 8601 format, e.g. 2024-03-20T10:00:00Z' },
        endTime:     { type: 'string', description: 'End time in ISO 8601 format, e.g. 2024-03-20T11:00:00Z' },
        location:    { type: 'string', description: 'Physical or virtual location of the event' },
        attendees:   { type: 'string', description: 'Comma-separated list of attendee email addresses' },
      },
      required: ['summary', 'startTime', 'endTime'],
    },
  },

  google_calendar_list: {
    name: 'list_calendar_events',
    description: 'List upcoming events from Google Calendar.',
    parameters: {
      type: 'object',
      properties: {
        timeMin:    { type: 'string', description: 'Start of time range in ISO 8601 (defaults to now)' },
        timeMax:    { type: 'string', description: 'End of time range in ISO 8601' },
        maxResults: { type: 'number', description: 'Maximum number of events (default 10)' },
        query:      { type: 'string', description: 'Free-text search filter' },
      },
      required: [],
    },
  },

  google_calendar_get: {
    name: 'get_calendar_event',
    description: 'Get details of a specific Google Calendar event by ID.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The Calendar event ID' },
      },
      required: ['eventId'],
    },
  },

  google_calendar_update: {
    name: 'update_calendar_event',
    description: 'Update an existing Google Calendar event.',
    parameters: {
      type: 'object',
      properties: {
        eventId:     { type: 'string', description: 'The event ID to update' },
        summary:     { type: 'string', description: 'New event title' },
        description: { type: 'string', description: 'New event description' },
        startTime:   { type: 'string', description: 'New start time in ISO 8601' },
        endTime:     { type: 'string', description: 'New end time in ISO 8601' },
        location:    { type: 'string', description: 'New location' },
        attendees:   { type: 'string', description: 'Comma-separated attendee emails (replaces existing)' },
      },
      required: ['eventId'],
    },
  },

  google_calendar_delete: {
    name: 'delete_calendar_event',
    description: 'Delete a Google Calendar event.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The event ID to delete' },
      },
      required: ['eventId'],
    },
  },

  // ── Google Sheets ─────────────────────────────────────────────────────────
  google_sheets_append: {
    name: 'append_row_to_sheet',
    description: 'Append a new row of data to a Google Sheets spreadsheet.',
    parameters: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'The spreadsheet ID from the URL' },
        range:         { type: 'string', description: 'Sheet name / range to append to (e.g. Sheet1!A1)' },
        values:        { type: 'string', description: 'Comma-separated values or JSON array for the row' },
      },
      required: ['spreadsheetId', 'values'],
    },
  },

  google_sheets_read: {
    name: 'read_sheet_range',
    description: 'Read a range of cells from a Google Sheets spreadsheet.',
    parameters: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'The spreadsheet ID from the URL' },
        range:         { type: 'string', description: 'Range to read (e.g. Sheet1!A1:D10 or Sheet1)' },
      },
      required: ['spreadsheetId', 'range'],
    },
  },

  google_sheets_update: {
    name: 'update_sheet_range',
    description: 'Overwrite a range of cells in a Google Sheets spreadsheet.',
    parameters: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'The spreadsheet ID from the URL' },
        range:         { type: 'string', description: 'Range to update (e.g. Sheet1!A1:C1)' },
        values:        { type: 'string', description: 'JSON array of arrays or comma-separated values to write' },
      },
      required: ['spreadsheetId', 'range', 'values'],
    },
  },

  google_sheets_clear: {
    name: 'clear_sheet_range',
    description: 'Clear all values in a range of a Google Sheets spreadsheet.',
    parameters: {
      type: 'object',
      properties: {
        spreadsheetId: { type: 'string', description: 'The spreadsheet ID from the URL' },
        range:         { type: 'string', description: 'Range to clear (e.g. Sheet1!A1:Z100 or Sheet1)' },
      },
      required: ['spreadsheetId', 'range'],
    },
  },

  google_sheets_create: {
    name: 'create_spreadsheet',
    description: 'Create a new Google Sheets spreadsheet.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the new spreadsheet' },
      },
      required: ['title'],
    },
  },
  
  // ── Logic Nodes ───────────────────────────────────────────────────────────
  tool_agent_caller: {
    name: 'agent_caller',
    description: 'Call another published AI agent to perform a sub-task or delegation.',
    parameters: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'The UUID of the target published agent.' },
        inputData: { type: 'string', description: 'The objective, request, or raw data to send to the sub-agent.' },
      },
      required: ['agentId'],
    },
  },

  logic_code: {
    name: 'execute_js_code',
    description: 'Execute custom JavaScript code to transform data or perform logic.',
    parameters: {
      type: 'object',
      properties: {
        jsCode: { type: 'string', description: 'The JavaScript code to execute. Return an object.' },
      },
      required: ['jsCode'],
    },
  },

  logic_filter: {
    name: 'filter_data',
    description: 'Check if a property matches a condition.',
    parameters: {
      type: 'object',
      properties: {
        property:     { type: 'string', description: 'Field name to check' },
        operator:     { type: 'string', enum: ['equal', 'notEqual', 'contains', 'greaterThan', 'lessThan'], description: 'Comparison operator' },
        value:        { type: 'string', description: 'Value to compare against' },
      },
      required: ['property', 'operator', 'value'],
    },
  },

  // ── Data Nodes ────────────────────────────────────────────────────────────
  data_mapper: {
    name: 'edit_data',
    description: 'Keep or strip specific fields from a data object.',
    parameters: {
      type: 'object',
      properties: {
        mode:   { type: 'string', enum: ['Keep Only Specified', 'Strip Specified'], description: 'Mapper mode' },
        fields: { type: 'string', description: 'Comma-separated field names' },
      },
      required: ['mode', 'fields'],
    },
  },

  // ── Core Nodes ────────────────────────────────────────────────────────────
  core_wait: {
    name: 'wait',
    description: 'Pause execution for a specified amount of time.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Number of units to wait' },
        unit:   { type: 'string', enum: ['seconds', 'minutes', 'hours'], description: 'Time unit' },
      },
      required: ['amount', 'unit'],
    },
  },

  core_datetime: {
    name: 'date_time',
    description: 'Get current date or format/manipulate dates.',
    parameters: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['getCurrentDate', 'formatDate', 'addToDate'], description: 'Action to perform' },
        date:      { type: 'string', description: 'ISO date string or leave empty for now' },
        format:    { type: 'string', description: 'Target format, e.g. yyyy-MM-dd HH:mm:ss' },
      },
      required: ['operation'],
    },
  },

  core_crypto: {
    name: 'crypto',
    description: 'Hash data or create HMAC signatures.',
    parameters: {
      type: 'object',
      properties: {
        action:    { type: 'string', enum: ['hash', 'hmac'], description: 'Hash or HMAC' },
        value:     { type: 'string', description: 'Data to process' },
        algorithm: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha512'], description: 'Hash algorithm' },
        secret:    { type: 'string', description: 'Secret key for HMAC' },
      },
      required: ['action', 'value', 'algorithm'],
    },
  },

  core_noop: {
    name: 'noop',
    description: 'Identity tool that returns exactly what it received. Helpful for flow control.',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Any data to pass through' },
      },
      required: [],
    },
  },

  mongodb_atlas: {
    name: 'mongodb_atlas',
    description: 'Interact with MongoDB Atlas. Operations: insertOne (add document), findOne (search one), findMany (search many), updateOne (edit one), upsert (update or insert), deleteOne (remove), createCollection (create table), listCollections (list tables), count (count docs).',
    parameters: {
      type: 'object',
      properties: {
        operation:  { type: 'string', enum: ['insertOne', 'findOne', 'findMany', 'updateOne', 'upsert', 'deleteOne', 'createCollection', 'listCollections', 'count'], description: 'Which MongoDB action to perform' },
        collection: { type: 'string', description: 'Target collection name' },
        document:   { type: 'string', description: '[insertOne, findOne, updateOne, upsert, deleteOne] JSON string of document or filter' },
        query:      { type: 'string', description: '[findMany, updateOne, upsert, count] JSON string of filter query' },
      },
      required: ['operation', 'collection'],
    },
  },

  redis: {
    name: 'redis',
    description: 'Interact with Redis key-value store. Operations: get (read key), set (write key), del (remove key), incr (increment), hset (hash set object), hget (hash get object), lpush (list append), lrange (get list).',
    parameters: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['get', 'set', 'del', 'incr', 'hset', 'hget', 'lpush', 'lrange'], description: 'Which Redis action to perform' },
        key:       { type: 'string', description: 'Target Redis key' },
        value:     { type: 'string', description: '[set, hset, lpush] Value to store (string or JSON for hset)' },
        ttl:       { type: 'string', description: '[set] Optional expiration time in seconds' },
      },
      required: ['operation', 'key'],
    },
  },

  // ── MCP Platform Routers ──────────────────────────────────────────────────
  github_mcp: {
    name: 'github',
    description: 'Manage GitHub. Operations: list (list issues), get (read issue), create (create issue), update (update issue).',
    parameters: {
      type: 'object',
      properties: {
        resource:  { type: 'string', enum: ['issue', 'repository', 'pullRequest'], default: 'issue' },
        operation: { type: 'string', enum: ['list', 'get', 'create', 'update'], default: 'list' },
        owner:     { type: 'string', description: 'GitHub username or organization' },
        repo:      { type: 'string', description: 'Repository name' },
        issueNumber: { type: 'number', description: 'The issue/PR number' },
        title:     { type: 'string', description: 'Title (for create/update)' },
        body:      { type: 'string', description: 'Body (for create/update)' },
        state:     { type: 'string', enum: ['open', 'closed'], description: 'State (for update)' },
      },
      required: ['operation', 'owner', 'repo'],
    },
  },

  slack_mcp: {
    name: 'slack',
    description: 'Manage Slack. Operations: post (send message), list (list channels), info (get channel info).',
    parameters: {
      type: 'object',
      properties: {
        resource:  { type: 'string', enum: ['message', 'channel'], default: 'message' },
        operation: { type: 'string', enum: ['post', 'list', 'info'], default: 'post' },
        channelId: { type: 'string', description: 'Channel ID (e.g. C12345678)' },
        text:      { type: 'string', description: 'Message content' },
        types:     { type: 'string', description: 'Channel types (e.g. public_channel,private_channel)' },
      },
      required: ['operation'],
    },
  },

  linear_mcp: {
    name: 'linear',
    description: 'Manage Linear. Operations: create (create issue), list (list issues), get (read issue), update (update issue).',
    parameters: {
      type: 'object',
      properties: {
        resource:  { type: 'string', enum: ['issue', 'project', 'cycle'], default: 'issue' },
        operation: { type: 'string', enum: ['create', 'list', 'get', 'update'], default: 'list' },
        teamId:    { type: 'string', description: 'Linear Team ID (required for create)' },
        title:     { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        issueId:   { type: 'string', description: 'ID of existing issue (for get/update)' },
      },
      required: ['operation'],
    },
  },

  notion_mcp: {
    name: 'notion',
    description: 'Manage Notion. Operations: search (search pages), create (create page), get (read page), update (update page).',
    parameters: {
      type: 'object',
      properties: {
        resource:  { type: 'string', enum: ['page', 'database', 'block'], default: 'page' },
        operation: { type: 'string', enum: ['search', 'create', 'get', 'update'], default: 'search' },
        query:     { type: 'string', description: 'Search term' },
        parentId:  { type: 'string', description: 'Parent page/database ID' },
        title:     { type: 'string', description: 'Page title' },
        pageId:    { type: 'string', description: 'Page ID' },
      },
      required: ['operation'],
    },
  },

  supabase_mcp: {
    name: 'supabase',
    description: 'Manage Supabase. Operations: select (query rows), insert (add rows), update (edit rows), delete (remove rows), rpc (call function).',
    parameters: {
      type: 'object',
      properties: {
        resource:  { type: 'string', enum: ['database', 'auth', 'storage'], default: 'database' },
        operation: { type: 'string', enum: ['select', 'insert', 'update', 'delete', 'rpc'], default: 'select' },
        table:     { type: 'string', description: 'Table name' },
        select:    { type: 'string', description: 'Columns to return (default: *)' },
        filter:    { type: 'string', description: 'JSON filter (e.g. {"id": 123})' },
        values:    { type: 'string', description: 'JSON data to insert/update' },
      },
      required: ['operation', 'table'],
    },
  },
};
