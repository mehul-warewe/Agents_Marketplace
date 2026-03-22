import axios from 'axios';
import { resolveGoogleToken } from '../credentialResolver.js';
import { ToolHandler } from './types.js';

// ─── Service routers (one execution key per Google service) ───────────────────
// Reads config.operation and dispatches to the specific handler below.

/** Run one or more operations. Priority:
 *  1. config.operation (string) — flat call from LLM tool-calling or legacy config
 *  2. config.operations (array) — multi-step pipeline mode set in NodeConfigPanel
 */
async function runOps(
  ctx: Parameters<ToolHandler>[0],
  map: Record<string, ToolHandler>,
): Promise<any> {
  // Priority 1: flat operation string (LLM-provided or legacy manual config)
  const singleOp = ctx.config.operation;
  if (singleOp) {
    const handler = map[singleOp];
    if (!handler) throw new Error(`Unknown operation: "${singleOp}". Valid: ${Object.keys(map).join(', ')}`);
    return handler(ctx);
  }

  // Priority 2: operations array (pipeline multi-step)
  const ops = (ctx.config as any).operations as Array<Record<string, string>> | undefined;
  if (Array.isArray(ops) && ops.length > 0) {
    const results: any[] = [];
    for (const { op, ...opFields } of ops) {
      if (!op) continue;
      const handler = map[op];
      if (!handler) throw new Error(`Unknown operation: "${op}". Valid: ${Object.keys(map).join(', ')}`);
      results.push(await handler({ ...ctx, config: { ...ctx.config, ...opFields, operation: op } }));
    }
    if (results.length === 0) throw new Error('No valid operations configured.');
    return results.length === 1 ? results[0] : { results, count: results.length };
  }

  throw new Error('No operation configured. Set an operation in the node config panel.');
}

export const googleGmail: ToolHandler = async (ctx) => runOps(ctx, {
  send:      googleGmailSend,
  search:    googleGmailSearch,
  get:       googleGmailGet,
  reply:     googleGmailReply,
  mark_read: googleGmailMarkRead,
  delete:    googleGmailDelete,
});

export const googleDrive: ToolHandler = async (ctx) => runOps(ctx, {
  upload:        googleDriveUpload,
  list:          googleDriveList,
  get_content:   googleDriveGetContent,
  delete:        googleDriveDelete,
  create_folder: googleDriveCreateFolder,
  share:         googleDriveShare,
});

export const googleCalendar: ToolHandler = async (ctx) => runOps(ctx, {
  create: googleCalendarCreate,
  list:   googleCalendarList,
  get:    googleCalendarGet,
  update: googleCalendarUpdate,
  delete: googleCalendarDelete,
});

export const googleSheets: ToolHandler = async (ctx) => runOps(ctx, {
  append: googleSheetsAppend,
  read:   googleSheetsRead,
  update: googleSheetsUpdate,
  clear:  googleSheetsClear,
  create: googleSheetsCreate,
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

function requireCred(config: Record<string, string>, service: string): string {
  if (!config.credentialId) throw new Error(`Google credential is required for ${service}.`);
  return config.credentialId;
}

/** Encode a raw RFC 2822 message to URL-safe base64 for the Gmail API */
function encodeRawMessage(parts: string[]): string {
  return Buffer.from(parts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Build a simple Gmail raw message */
function buildGmailRaw(to: string, from: string | undefined, subject: string, body: string, headers: Record<string, string> = {}): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const parts = [
    `To: ${to}`,
    ...(from ? [`From: ${from}`] : []),
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`),
    '',
    body,
  ];
  return encodeRawMessage(parts);
}

/** Extract ID from URL if provided, otherwise return as-is */
function resolveId(val: string): string {
  if (!val || typeof val !== 'string') return val;
  if (!val.includes('/')) return val; // Already an ID
  
  // Gmail Thread/Message: https://mail.google.com/mail/u/0/#inbox/FMfcgzG...
  if (val.includes('#')) {
    const parts = val.split('/');
    return parts[parts.length - 1] || val;
  }
  
  // Drive/Sheets/Docs/Calendar: https://docs.google.com/spreadsheets/d/1abc.../edit
  const segments = val.split('/');
  const dIdx = segments.indexOf('d');
  if (dIdx !== -1 && segments[dIdx + 1]) return segments[dIdx + 1]!;
  
  // Generic: last segment
  return segments.pop() || val;
}

// ─────────────────────────────────────────────────────────────────────────────
// GMAIL
// ─────────────────────────────────────────────────────────────────────────────

/** Send a new email */
export const googleGmailSend: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);

  const to      = render(config.to);
  const subject = render(config.subject);
  const body    = render(config.body);

  const raw = buildGmailRaw(to, undefined, subject, body);
  const res = await axios.post(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { raw: raw as string },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId: res.data.id };
};

/** Search / list emails */
export const googleGmailSearch: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);

  const query      = render(config.query || '');
  const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;

  // List matching message IDs
  const listRes = await axios.get(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
    {
      params: { q: query || undefined, maxResults },
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const messages: any[] = listRes.data.messages || [];
  if (messages.length === 0) return { success: true, emails: [], total: 0 };

  // Fetch snippets for each message (parallel, max 10)
  const details = await Promise.all(
    messages.slice(0, 10).map(async (m: any) => {
      const detail = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const headers: any[] = detail.data.payload?.headers || [];
      const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      return {
        id:      m.id,
        subject: get('Subject'),
        from:    get('From'),
        date:    get('Date'),
        snippet: detail.data.snippet || '',
      };
    }),
  );

  return { success: true, emails: details, total: listRes.data.resultSizeEstimate || details.length };
};

/** Get full content of a single email by ID */
export const googleGmailGet: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);

  const messageId = resolveId(render(config.messageId));
  if (!messageId) throw new Error('messageId is required.');

  const res = await axios.get(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const headers: any[] = res.data.payload?.headers || [];
  const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract plain-text or HTML body
  function extractBody(payload: any): string {
    if (!payload) return '';
    if (payload.body?.data) return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    if (payload.parts) {
      for (const part of payload.parts) {
        const text = extractBody(part);
        if (text) return text;
      }
    }
    return '';
  }

  const body = extractBody(res.data.payload);
  return {
    success: true,
    id:      res.data.id,
    subject: get('Subject'),
    from:    get('From'),
    to:      get('To'),
    date:    get('Date'),
    body,
    snippet: res.data.snippet || '',
  };
};

/** Reply to an existing email thread */
export const googleGmailReply: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);

  const messageId = resolveId(render(config.messageId));
  const body      = render(config.body);
  if (!messageId) throw new Error('messageId is required for reply.');

  // Fetch the original to get headers
  const orig = await axios.get(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Message-ID`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const headers: any[] = orig.data.payload?.headers || [];
  const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const origSubject   = get('Subject');
  const origFrom      = get('From');
  const origMessageId = get('Message-ID');
  const threadId      = orig.data.threadId;

  const raw = buildGmailRaw(
    origFrom,
    undefined,
    origSubject.startsWith('Re:') ? origSubject : `Re: ${origSubject}`,
    body,
    {
      'In-Reply-To': origMessageId,
      'References':  origMessageId,
    },
  );

  const res = await axios.post(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { raw, threadId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId: res.data.id, threadId: res.data.threadId };
};

/** Mark an email as read or unread */
export const googleGmailMarkRead: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);

  const messageId = resolveId(render(config.messageId));
  const markAs    = render(config.markAs || 'read'); // 'read' | 'unread'

  const body = markAs === 'unread'
    ? { addLabelIds: ['UNREAD'] }
    : { removeLabelIds: ['UNREAD'] };

  await axios.post(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    body,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId, markedAs: markAs };
};

/** Delete (trash) an email */
export const googleGmailDelete: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);

  const messageId = resolveId(render(config.messageId));
  if (!messageId) throw new Error('messageId is required.');

  await axios.delete(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId, trashed: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE DRIVE
// ─────────────────────────────────────────────────────────────────────────────

/** Upload a text file */
export const googleDriveUpload: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Drive');
  const token    = await resolveGoogleToken(credentialId, userId);
  const fileName = render(config.fileName || 'Untitled.txt');
  const content  = render(config.content || '');
  const folderId = resolveId(render(config.folderId || ''));

  const metadata: any = { name: fileName, mimeType: 'text/plain' };
  if (folderId) metadata.parents = [folderId];

  const boundary = 'aether_boundary';
  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const res = await axios.post(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    multipartBody,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` } },
  );
  return { success: true, fileId: res.data.id, name: res.data.name };
};

/** List files in Drive (optionally filtered by query) */
export const googleDriveList: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Drive');
  const token      = await resolveGoogleToken(credentialId, userId);
  const query      = render(config.query || '');
  const maxResults = parseInt(render(config.maxResults || '20'), 10) || 20;
  const folderId   = resolveId(render(config.folderId || ''));

  let q = query || '';
  if (folderId) q = q ? `${q} and '${folderId}' in parents` : `'${folderId}' in parents`;
  q = q ? `${q} and trashed=false` : 'trashed=false';

  const res = await axios.get(
    'https://www.googleapis.com/drive/v3/files',
    {
      params: {
        q,
        pageSize: maxResults,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
      },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return { success: true, files: res.data.files || [], total: (res.data.files || []).length };
};

/** Get the content of a file by ID */
export const googleDriveGetContent: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Drive');
  const token  = await resolveGoogleToken(credentialId, userId);
  const fileId = render(config.fileId);
  if (!fileId) throw new Error('fileId is required.');

  // First get metadata to know the mimeType
  const meta = await axios.get(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const mimeType: string = meta.data.mimeType || '';

  let content = '';
  if (mimeType.startsWith('application/vnd.google-apps.')) {
    // Google Workspace files — export as plain text
    const exportMime = mimeType === 'application/vnd.google-apps.spreadsheet'
      ? 'text/csv'
      : 'text/plain';
    const exportRes = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMime}`,
      { headers: { Authorization: `Bearer ${token}` }, responseType: 'text' },
    );
    content = exportRes.data;
  } else {
    // Binary/text download
    const dlRes = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` }, responseType: 'text' },
    );
    content = typeof dlRes.data === 'string' ? dlRes.data : JSON.stringify(dlRes.data);
  }

  return { success: true, fileId, name: meta.data.name, mimeType, content };
};

/** Delete a file */
export const googleDriveDelete: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Drive');
  const token  = await resolveGoogleToken(credentialId, userId);
  const fileId = render(config.fileId);
  if (!fileId) throw new Error('fileId is required.');

  await axios.delete(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, fileId, deleted: true };
};

/** Create a folder */
export const googleDriveCreateFolder: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Drive');
  const token      = await resolveGoogleToken(credentialId, userId);
  const folderName = render(config.folderName || 'New Folder');
  const parentId   = resolveId(render(config.parentId || ''));

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const res = await axios.post(
    'https://www.googleapis.com/drive/v3/files',
    metadata,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );
  return { success: true, folderId: res.data.id, name: res.data.name };
};

/** Share a file or folder */
export const googleDriveShare: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Drive');
  const token       = await resolveGoogleToken(credentialId, userId);
  const fileId      = resolveId(render(config.fileId));
  const emailAddress = render(config.emailAddress || '');
  const role        = render(config.role || 'reader'); // reader | writer | commenter
  const type        = emailAddress ? 'user' : 'anyone';

  if (!fileId) throw new Error('fileId is required.');

  const permission: any = { role, type };
  if (emailAddress) permission.emailAddress = emailAddress;

  const res = await axios.post(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    permission,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );
  return { success: true, fileId, permissionId: res.data.id, role, type };
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

/** Create an event */
export const googleCalendarCreate: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Calendar');
  const token = await resolveGoogleToken(credentialId, userId);

  const summary     = render(config.summary);
  const description = render(config.description || '');
  const start       = render(config.startTime);
  const end         = render(config.endTime);
  const attendees   = render(config.attendees || '');  // comma-separated emails
  const location    = render(config.location || '');

  const event: any = {
    summary,
    description,
    location,
    start: { dateTime: start, timeZone: 'UTC' },
    end:   { dateTime: end,   timeZone: 'UTC' },
  };

  if (attendees) {
    event.attendees = attendees.split(',').map((e: string) => ({ email: e.trim() }));
  }

  const res = await axios.post(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    event,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  
  console.log(`[Google API] Event Created: ${res.data.htmlLink}`);
  return { success: true, eventId: res.data.id, link: res.data.htmlLink };
};

/** List upcoming events */
export const googleCalendarList: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Calendar');
  const token      = await resolveGoogleToken(credentialId, userId);
  const timeMin    = render(config.timeMin || new Date().toISOString());
  const timeMax    = render(config.timeMax || '');
  const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
  const query      = render(config.query || '');

  const params: any = {
    timeMin,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  };
  if (timeMax) params.timeMax = timeMax;
  if (query)   params.q = query;

  const res = await axios.get(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    { params, headers: { Authorization: `Bearer ${token}` } },
  );

  const events = (res.data.items || []).map((e: any) => ({
    id:          e.id,
    summary:     e.summary,
    description: e.description || '',
    start:       e.start?.dateTime || e.start?.date,
    end:         e.end?.dateTime   || e.end?.date,
    location:    e.location || '',
    link:        e.htmlLink,
    attendees:   (e.attendees || []).map((a: any) => a.email),
  }));

  return { success: true, events, total: events.length };
};

/** Update an existing event */
export const googleCalendarUpdate: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Calendar');
  const token   = await resolveGoogleToken(credentialId, userId);
  const eventId = render(config.eventId);
  if (!eventId) throw new Error('eventId is required.');

  const patch: any = {};
  if (config.summary)     patch.summary     = render(config.summary);
  if (config.description) patch.description = render(config.description);
  if (config.location)    patch.location    = render(config.location);
  if (config.startTime)   patch.start = { dateTime: render(config.startTime), timeZone: 'UTC' };
  if (config.endTime)     patch.end   = { dateTime: render(config.endTime),   timeZone: 'UTC' };
  if (config.attendees) {
    patch.attendees = render(config.attendees).split(',').map((e: string) => ({ email: e.trim() }));
  }

  const res = await axios.patch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    patch,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, eventId: res.data.id, link: res.data.htmlLink };
};

/** Delete an event */
export const googleCalendarDelete: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Calendar');
  const token   = await resolveGoogleToken(credentialId, userId);
  const eventId = render(config.eventId);
  if (!eventId) throw new Error('eventId is required.');

  await axios.delete(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, eventId, deleted: true };
};

/** Get a single event by ID */
export const googleCalendarGet: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Calendar');
  const token   = await resolveGoogleToken(credentialId, userId);
  const eventId = render(config.eventId);
  if (!eventId) throw new Error('eventId is required.');

  const res = await axios.get(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const e = res.data;
  return {
    success:     true,
    eventId:     e.id,
    summary:     e.summary,
    description: e.description || '',
    start:       e.start?.dateTime || e.start?.date,
    end:         e.end?.dateTime   || e.end?.date,
    location:    e.location || '',
    link:        e.htmlLink,
    attendees:   (e.attendees || []).map((a: any) => a.email),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SHEETS
// ─────────────────────────────────────────────────────────────────────────────

/** Append a row */
export const googleSheetsAppend: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Sheets');
  const token         = await resolveGoogleToken(credentialId, userId);
  const spreadsheetId = resolveId(render(config.spreadsheetId));
  const range         = render(config.range || 'Sheet1!A1');
  const values        = render(config.values);

  let rowValues: any[] = [];
  try {
    rowValues = JSON.parse(values);
    if (!Array.isArray(rowValues)) rowValues = [rowValues];
  } catch {
    rowValues = values.split(',').map((v: string) => v.trim());
  }

  const res = await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    { values: [rowValues] },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, updatedRange: res.data.updates?.updatedRange };
};

/** Read a range of cells */
export const googleSheetsRead: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Sheets');
  const token         = await resolveGoogleToken(credentialId, userId);
  const spreadsheetId = resolveId(render(config.spreadsheetId));
  const range         = render(config.range || 'Sheet1');

  const res = await axios.get(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const rows: any[][] = res.data.values || [];
  // If the first row looks like headers, build an array of objects
  let data: any = rows;
  if (rows.length > 1) {
    const headers = rows[0] as string[];
    data = rows.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
    );
  }

  return { success: true, range: res.data.range, rows, data, total: rows.length };
};

/** Update (overwrite) a range */
export const googleSheetsUpdate: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Sheets');
  const token         = await resolveGoogleToken(credentialId, userId);
  const spreadsheetId = resolveId(render(config.spreadsheetId));
  const range         = render(config.range || 'Sheet1!A1');
  const values        = render(config.values);

  // Support JSON array of arrays or CSV
  let matrix: any[][] = [];
  try {
    const parsed = JSON.parse(values);
    if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
      matrix = parsed;
    } else if (Array.isArray(parsed)) {
      matrix = [parsed];
    }
  } catch {
    matrix = [values.split(',').map((v: string) => v.trim())];
  }

  const res = await axios.put(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    { range, majorDimension: 'ROWS', values: matrix },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, updatedRange: res.data.updatedRange, updatedCells: res.data.updatedCells };
};

/** Clear a range */
export const googleSheetsClear: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Sheets');
  const token         = await resolveGoogleToken(credentialId, userId);
  const spreadsheetId = resolveId(render(config.spreadsheetId));
  const range         = render(config.range || 'Sheet1');

  const res = await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, clearedRange: res.data.clearedRange };
};

/** Create a new spreadsheet */
export const googleSheetsCreate: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Sheets');
  const token = await resolveGoogleToken(credentialId, userId);
  const title = render(config.title || 'New Spreadsheet');

  const res = await axios.post(
    'https://sheets.googleapis.com/v4/spreadsheets',
    { properties: { title } },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );
  return {
    success:       true,
    spreadsheetId: res.data.spreadsheetId,
    title:         res.data.properties?.title,
    url:           res.data.spreadsheetUrl,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBE
// ─────────────────────────────────────────────────────────────────────────────

export const googleYoutube: ToolHandler = async (ctx) => runOps(ctx, {
  channel_stats:   googleYoutubeChannelStats,
  list_my_videos:  googleYoutubeListVideos,
  video_stats:     googleYoutubeVideoStats,
  analytics:       googleYoutubeAnalytics,
});

/** Get statistics for the authenticated channel */
export const googleYoutubeChannelStats: ToolHandler = async ({ config, userId }) => {
  const credentialId = requireCred(config, 'YouTube');
  const token = await resolveGoogleToken(credentialId, userId);

  const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: { part: 'statistics,snippet,contentDetails', mine: true },
    headers: { Authorization: `Bearer ${token}` },
  });

  const channel = res.data.items?.[0];
  if (!channel) throw new Error('No YouTube channel found for this account.');

  return {
    success: true,
    channelId: channel.id,
    title: channel.snippet.title,
    statistics: channel.statistics,
  };
};

/** List authenticated user's videos */
export const googleYoutubeListVideos: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'YouTube');
  const token = await resolveGoogleToken(credentialId, userId);
  const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;

  const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: { part: 'snippet', forMine: true, type: 'video', maxResults, order: 'date' },
    headers: { Authorization: `Bearer ${token}` },
  });

  const videos = (res.data.items || []).map((v: any) => ({
    videoId: v.id.videoId,
    title: v.snippet.title,
    publishedAt: v.snippet.publishedAt,
    thumbnail: v.snippet.thumbnails?.default?.url,
  }));

  return { success: true, videos, total: res.data.pageInfo?.totalResults };
};

/** Get stats for a specific video */
export const googleYoutubeVideoStats: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'YouTube');
  const token = await resolveGoogleToken(credentialId, userId);
  const videoId = resolveId(render(config.videoId));
  if (!videoId) throw new Error('videoId is required.');

  const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: { part: 'statistics,snippet', id: videoId },
    headers: { Authorization: `Bearer ${token}` },
  });

  const video = res.data.items?.[0];
  if (!video) throw new Error(`Video not found: ${videoId}`);

  return {
    success: true,
    videoId: video.id,
    title: video.snippet.title,
    statistics: video.statistics,
  };
};

/** Query YouTube Analytics reports */
export const googleYoutubeAnalytics: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'YouTube');
  const token = await resolveGoogleToken(credentialId, userId);

  // default to last 30 days if not provided
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const startDate = render(config.startDate || thirtyDaysAgo.toISOString().split('T')[0]);
  const endDate   = render(config.endDate   || now.toISOString().split('T')[0]);
  const metrics   = render(config.metrics   || 'views,comments,likes,dislikes,estimatedMinutesWatched,averageViewDuration');
  const dimensions = render(config.dimensions || 'day');

  const res = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
    params: {
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics,
      dimensions,
      sort: dimensions.includes('day') ? 'day' : undefined,
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  return {
    success: true,
    columnHeaders: res.data.columnHeaders,
    rows: res.data.rows,
  };
};

