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
      return { status: 'success', data: res.data };
    }

    case 'search': {
      const query = render(config.query || '');
      const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
      const listRes = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        { params: { q: query || undefined, maxResults }, headers },
      );
      return { status: 'success', data: listRes.data };
    }

    case 'get': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'reply': {
      const messageId = resolveId(render(config.messageId));
      const replyBody = render(config.body);
      const msgRes = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers },
      );
      const originalSubject = msgRes.data.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
      const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
      const raw = buildGmailRaw('', undefined, replySubject, replyBody, { 'In-Reply-To': messageId });
      const replyRes = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw, threadId: msgRes.data.threadId },
        { headers },
      );
      return { status: 'success', data: replyRes.data };
    }

    case 'mark_read': {
      const messageId = resolveId(render(config.messageId));
      const markAs = render(config.markAs || 'read');
      const body = markAs === 'unread' ? { addLabelIds: ['UNREAD'] } : { removeLabelIds: ['UNREAD'] };
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        body,
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'delete': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {},
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'archive': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        { removeLabelIds: ['INBOX'] },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'list': {
      const query = render(config.q || '');
      const maxResults = parseInt(render(config.maxResults || '20'), 10) || 20;
      const pageToken = render(config.pageToken || '');
      const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
        params: { q: query || undefined, maxResults, pageToken: pageToken || undefined },
        headers,
      });
      return { status: 'success', data: res.data };
    }

    case 'getAttachment': {
      const messageId = resolveId(render(config.messageId));
      const attachmentId = render(config.attachmentId);
      const res = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'addLabel': {
      const messageId = resolveId(render(config.messageId));
      const label = render(config.label);
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        { addLabelIds: [label] },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'removeLabel': {
      const messageId = resolveId(render(config.messageId));
      const label = render(config.label);
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        { removeLabelIds: [label] },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'forward': {
      const messageId = resolveId(render(config.messageId));
      const forwardTo = render(config.to);
      const customMessage = render(config.message || '');
      const msgRes = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers },
      );
      const subject = msgRes.data.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
      const fwdSubject = subject.startsWith('Fwd:') ? subject : `Fwd: ${subject}`;
      const raw = buildGmailRaw(forwardTo, undefined, fwdSubject, customMessage);
      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'draftCreate': {
      const to = render(config.to);
      const subject = render(config.subject);
      const body = render(config.body);
      const raw = buildGmailRaw(to, undefined, subject, body);
      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
        { message: { raw } },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'draftSend': {
      const draftId = resolveId(render(config.draftId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}/send`,
        {},
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'draftDelete': {
      const draftId = resolveId(render(config.draftId));
      const res = await axios.delete(
        `https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`,
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'moveToTrash': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {},
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'permanentlyDelete': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.delete(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'restoreFromTrash': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/untrash`,
        {},
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'getThread': {
      const threadId = resolveId(render(config.threadId));
      const res = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'listThreads': {
      const query = render(config.q || '');
      const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
      const res = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/threads', {
        params: { q: query || undefined, maxResults },
        headers,
      });
      return { status: 'success', data: res.data };
    }

    case 'markAsSpam': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        { addLabelIds: ['SPAM'] },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'unmarkAsSpam': {
      const messageId = resolveId(render(config.messageId));
      const res = await axios.post(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        { removeLabelIds: ['SPAM'] },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'createFilter': {
      const from = render(config.from || '');
      const to = render(config.to || '');
      const subject = render(config.subject || '');
      const action = render(config.action || 'archive');
      const criteria: any = {};
      if (from) criteria.from = from;
      if (to) criteria.to = to;
      if (subject) criteria.subject = subject;
      const res = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/settings/filters',
        { criteria, action: { skip_trash: action === 'skip_trash', archive: action === 'archive' } },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    case 'createSignature': {
      const signature = render(config.signature);
      const res = await axios.patch(
        'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/me',
        { signature },
        { headers },
      );
      return { status: 'success', data: res.data };
    }

    default:
      throw new Error(`Unknown Gmail operation: ${operation}`);
  }
};
