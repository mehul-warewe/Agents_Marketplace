import type { NodeDefinition } from '../types';

export const googleNodes: NodeDefinition[] = [
  // ─── Gmail ──────────────────────────────────────────────────────────────────
  {
    id: 'google.gmail',
    label: 'Gmail',
    name: 'Gmail',
    category: 'Tools',
    variant: 'connector',
    description: 'Send, search, read, reply to, or delete emails via Gmail.',
    icon: '/iconSvg/google-gmail.svg',
    color: '#ea4335',
    bg: 'bg-[#ea4335]/10',
    border: 'border-[#ea4335]/20',
    isTrigger: false,
    executionKey: 'google_gmail',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'data', position: 'right' }],
    credentialTypes: ['google_gmail_oauth'],
    configFields: [
      {
        key: 'auth_notice',
        label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
        type: 'notice',
      },
      { key: 'resource', label: 'Resource', type: 'select', options: ['message', 'thread'] },
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        options: ['send', 'reply', 'search', 'get', 'mark_read', 'delete'],
      },
    ],
    operationFields: {
      send: [
        { key: 'to', label: 'To Address', type: 'text', placeholder: 'recipient@gmail.com' },
        { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Hello from warewe' },
        { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Write your message...' },
      ],
      search: [
        { key: 'query', label: 'Search Query', type: 'text', placeholder: 'from:boss@company.com is:unread' },
        { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '10' },
      ],
      get: [
        { key: 'messageId', label: 'Message ID', type: 'text', placeholder: '18d3f2a...' },
      ],
      reply: [
        { key: 'messageId', label: 'Message ID to Reply To', type: 'text', placeholder: '18d3f2a...' },
        { key: 'body', label: 'Reply Body', type: 'textarea', placeholder: 'Your reply...' },
      ],
      mark_read: [
        { key: 'messageId', label: 'Message ID', type: 'text', placeholder: '18d3f2a...' },
        { key: 'markAs', label: 'Mark As', type: 'select', options: ['read', 'unread'] },
      ],
      delete: [
        { key: 'messageId', label: 'Message ID', type: 'text', placeholder: '18d3f2a...' },
      ],
    },
  },

  // ─── Google Drive ────────────────────────────────────────────────────────────
  {
    id: 'google.drive',
    label: 'Google Drive',
    name: 'Drive',
    category: 'Tools',
    variant: 'connector',
    description: 'Upload, list, read, delete, create folders, or share files in Google Drive.',
    icon: '/iconSvg/google-drive.svg',
    color: '#fbbc04',
    bg: 'bg-[#fbbc04]/10',
    border: 'border-[#fbbc04]/20',
    isTrigger: false,
    executionKey: 'google_drive',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'data', position: 'right' }],
    credentialTypes: ['google_drive_oauth'],
    configFields: [
      {
        key: 'auth_notice',
        label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
        type: 'notice',
      },
      { key: 'resource', label: 'Resource', type: 'select', options: ['file', 'folder'] },
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        options: ['upload', 'list', 'get_content', 'create_folder', 'share', 'delete'],
      },
    ],
    operationFields: {
      upload: [
        { key: 'fileName', label: 'File Name', type: 'text', placeholder: 'report.txt' },
        { key: 'content', label: 'File Content', type: 'textarea', placeholder: 'Content to upload...' },
        { key: 'folderId', label: 'Folder ID (optional)', type: 'text', placeholder: 'Leave empty for root' },
      ],
      list: [
        { key: 'query', label: 'Filter Query (optional)', type: 'text', placeholder: "name contains 'report'" },
        { key: 'folderId', label: 'Folder ID (optional)', type: 'text', placeholder: 'Leave empty for all files' },
        { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '20' },
      ],
      get_content: [
        { key: 'fileId', label: 'File ID', type: 'text', placeholder: '1BxiMV...' },
      ],
      delete: [
        { key: 'fileId', label: 'File ID', type: 'text', placeholder: '1BxiMV...' },
      ],
      create_folder: [
        { key: 'folderName', label: 'Folder Name', type: 'text', placeholder: 'My Reports' },
        { key: 'parentId', label: 'Parent Folder ID (optional)', type: 'text', placeholder: 'Leave empty for root' },
      ],
      share: [
        { key: 'fileId', label: 'File or Folder ID', type: 'text', placeholder: '1BxiMV...' },
        { key: 'emailAddress', label: 'Share with Email (optional)', type: 'text', placeholder: 'user@example.com — empty = anyone' },
        { key: 'role', label: 'Permission', type: 'select', options: ['reader', 'writer', 'commenter'] },
      ],
    },
  },

  // ─── Google Calendar ─────────────────────────────────────────────────────────
  {
    id: 'google.calendar',
    label: 'Google Calendar',
    name: 'Calendar',
    category: 'Tools',
    variant: 'connector',
    description: 'Create, list, update, get, or delete events in Google Calendar.',
    icon: '/iconSvg/google-calendar.svg',
    color: '#4285f4',
    bg: 'bg-[#4285f4]/10',
    border: 'border-[#4285f4]/20',
    isTrigger: false,
    executionKey: 'google_calendar',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'data', position: 'right' }],
    credentialTypes: ['google_calendar_oauth'],
    configFields: [
      {
        key: 'auth_notice',
        label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
        type: 'notice',
      },
      { key: 'resource', label: 'Resource', type: 'select', options: ['event'] },
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        options: ['create', 'list', 'get', 'update', 'delete'],
      },
    ],
    operationFields: {
      create: [
        { key: 'summary', label: 'Event Title', type: 'text', placeholder: 'Team Meeting' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Agenda...' },
        { key: 'startTime', label: 'Start Time (ISO)', type: 'text', placeholder: '2024-03-20T10:00:00Z' },
        { key: 'endTime', label: 'End Time (ISO)', type: 'text', placeholder: '2024-03-20T11:00:00Z' },
        { key: 'location', label: 'Location (optional)', type: 'text', placeholder: 'Conference Room A' },
        { key: 'attendees', label: 'Attendees (comma-separated emails)', type: 'text', placeholder: 'alice@example.com, bob@example.com' },
      ],
      list: [
        { key: 'timeMin', label: 'From (ISO, default: now)', type: 'text', placeholder: '2024-03-01T00:00:00Z' },
        { key: 'timeMax', label: 'To (ISO, optional)', type: 'text', placeholder: '2024-04-01T00:00:00Z' },
        { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '10' },
        { key: 'query', label: 'Search Filter (optional)', type: 'text', placeholder: 'meeting' },
      ],
      get: [
        { key: 'eventId', label: 'Event ID', type: 'text', placeholder: 'abc123...' },
      ],
      update: [
        { key: 'eventId', label: 'Event ID', type: 'text', placeholder: 'abc123...' },
        { key: 'summary', label: 'New Title', type: 'text', placeholder: 'Updated Meeting' },
        { key: 'description', label: 'New Description', type: 'textarea', placeholder: 'Updated agenda...' },
        { key: 'startTime', label: 'New Start (ISO)', type: 'text', placeholder: '2024-03-20T10:00:00Z' },
        { key: 'endTime', label: 'New End (ISO)', type: 'text', placeholder: '2024-03-20T11:00:00Z' },
        { key: 'location', label: 'New Location', type: 'text', placeholder: 'Room B' },
        { key: 'attendees', label: 'New Attendees', type: 'text', placeholder: 'alice@example.com, bob@example.com' },
      ],
      delete: [
        { key: 'eventId', label: 'Event ID', type: 'text', placeholder: 'abc123...' },
      ],
    },
  },

  // ─── Google Sheets ───────────────────────────────────────────────────────────
  {
    id: 'google.sheets',
    label: 'Google Sheets',
    name: 'Sheets',
    category: 'Tools',
    variant: 'connector',
    description: 'Append, read, update, clear, or create Google Sheets spreadsheets.',
    icon: '/iconSvg/google-sheets-icon.svg',
    color: '#34a853',
    bg: 'bg-[#34a853]/10',
    border: 'border-[#34a853]/20',
    isTrigger: false,
    executionKey: 'google_sheets',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'data', position: 'right' }],
    credentialTypes: ['google_sheets_oauth'],
    configFields: [
      {
        key: 'auth_notice',
        label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
        type: 'notice',
      },
      { key: 'resource', label: 'Resource', type: 'select', options: ['spreadsheet', 'sheet'] },
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        options: ['append', 'read', 'update', 'clear', 'create'],
      },
    ],
    operationFields: {
      append: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
        { key: 'range', label: 'Sheet / Range', type: 'text', placeholder: 'Sheet1!A1' },
        { key: 'values', label: 'Row Values', type: 'textarea', placeholder: 'val1, val2  or  ["val1","val2"]' },
      ],
      read: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
        { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A1:D20 or Sheet1' },
      ],
      update: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
        { key: 'range', label: 'Range', type: 'text', placeholder: 'Sheet1!A1:C1' },
        { key: 'values', label: 'Values (JSON)', type: 'textarea', placeholder: '[["Name","Age"],["Alice",30]]' },
      ],
      clear: [
        { key: 'spreadsheetId', label: 'Spreadsheet ID', type: 'text', placeholder: 'ID from the URL' },
        { key: 'range', label: 'Range to Clear', type: 'text', placeholder: 'Sheet1!A1:Z100 or Sheet1' },
      ],
      create: [
        { key: 'title', label: 'Spreadsheet Title', type: 'text', placeholder: 'My New Spreadsheet' },
      ],
    },
  },
];
