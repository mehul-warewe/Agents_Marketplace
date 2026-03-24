import axios from 'axios';
import type { ToolHandler, ToolContext } from '../../types.js';

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
  return Buffer.from(parts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Extract ID from URL if provided, otherwise return as-is */
function resolveId(val: string): string {
  if (!val || typeof val !== 'string') return val;
  if (!val.includes('/')) return val; // Already an ID
  const segments = val.split('/');
  const dIdx = segments.indexOf('d');
  if (dIdx !== -1 && segments[dIdx + 1]) return segments[dIdx + 1]!;
  return segments.pop() || val;
}

export const gmailHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render, credentials } = ctx;
  const operation = config.operation;
  
  // Gmail uses OAuth2, so the accessToken is in credentials
  const token = credentials?.accessToken;
  if (!token) throw new Error('Gmail node requires a valid Google OAuth2 credential.');

  const headers = { Authorization: `Bearer ${token}` };

  switch (operation) {
    case 'send': {
      const to = render(config.to);
      const subject = render(config.subject);
      const body = render(config.body);
      const raw = buildGmailRaw(to, undefined, subject, body);
      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw },
        { headers },
      );
      return { success: true, messageId: res.data.id };
    }

    case 'search': {
      const query = render(config.query || '');
      const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
      const listRes = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        { params: { q: query || undefined, maxResults }, headers },
      );
      return { success: true, emails: listRes.data.messages || [], total: listRes.data.resultSizeEstimate };
    }

    case 'get': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers },
      );
      return { success: true, ...res.data };
    }

    case 'mark_read': {
      const messageId = resolveId(render(config.messageId));
      const markAs = render(config.markAs || 'read');
      const body = markAs === 'unread' ? { addLabelIds: ['UNREAD'] } : { removeLabelIds: ['UNREAD'] };
      await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        body,
        { headers },
      );
      return { success: true, messageId, markedAs: markAs };
    }

    case 'delete': {
      const messageId = resolveId(render(config.messageId));
      await axios.delete(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        { headers },
      );
      return { success: true, messageId, trashed: true };
    }

    default:
      throw new Error(`Unknown Gmail operation: ${operation}`);
  }
};
