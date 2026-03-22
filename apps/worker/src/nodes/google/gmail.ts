import axios from 'axios';
import { resolveGoogleToken } from '../../credentialResolver.js';
import { ToolHandler } from '../../tools/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireCred(config: Record<string, string>, service: string): string {
  if (!config.credentialId) throw new Error(`Google credential is required for ${service}.`);
  return config.credentialId;
}

function encodeRawMessage(parts: string[]): string {
  return Buffer.from(parts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

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

// ─── Operations ───────────────────────────────────────────────────────────────

export const send: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);
  const to = render(config.to);
  const subject = render(config.subject);
  const rawBody = render(config.body);
  // Auto-convert newlines to <br> for HTML rendering if no HTML tags detected
  const body = rawBody.includes('<') && rawBody.includes('>') 
    ? rawBody 
    : rawBody.replace(/\n/g, '<br>');

  console.log(`[Gmail] Attempting to send email to: "${to}" | Subject: "${subject}" | Body snippet: "${body.substring(0, 50)}..."`);

  if (!to || !to.includes('@')) {
    throw new Error(`Invalid recipient address: "${to}". Please ensure the 'To Address' field is filled correctly.`);
  }

  const raw = buildGmailRaw(to, undefined, subject, body);
  const res = await axios.post(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { raw },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId: res.data.id };
};

export const search: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);
  const query = render(config.query || '');
  const maxResults = parseInt(render(config.maxResults || '10'), 10) || 10;
  const listRes = await axios.get(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages`,
    {
      params: { q: query || undefined, maxResults },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const messages: any[] = listRes.data.messages || [];
  if (messages.length === 0) return { success: true, emails: [], total: 0 };
  const details = await Promise.all(
    messages.slice(0, 10).map(async (m: any) => {
      const detail = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const headers: any[] = detail.data.payload?.headers || [];
      const get = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      return { id: m.id, subject: get('Subject'), from: get('From'), date: get('Date'), snippet: detail.data.snippet || '' };
    }),
  );
  return { success: true, emails: details, total: listRes.data.resultSizeEstimate || details.length };
};

export const get: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);
  const messageId = render(config.messageId);
  if (!messageId) throw new Error('messageId is required.');
  const res = await axios.get(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const headers: any[] = res.data.payload?.headers || [];
  const findHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
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
  return {
    success: true,
    id: res.data.id,
    subject: findHeader('Subject'),
    from: findHeader('From'),
    to: findHeader('To'),
    date: findHeader('Date'),
    body: extractBody(res.data.payload),
    snippet: res.data.snippet || '',
  };
};

export const reply: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);
  const messageId = render(config.messageId);
  const body = render(config.body);
  if (!messageId) throw new Error('messageId is required for reply.');
  const orig = await axios.get(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Message-ID`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const headers: any[] = orig.data.payload?.headers || [];
  const findHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  const origSubject = findHeader('Subject');
  const origFrom = findHeader('From');
  const origMessageId = findHeader('Message-ID');
  const threadId = orig.data.threadId;
  const raw = buildGmailRaw(origFrom, undefined, origSubject.startsWith('Re:') ? origSubject : `Re: ${origSubject}`, body, {
    'In-Reply-To': origMessageId,
    'References': origMessageId,
  });
  const res = await axios.post(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    { raw, threadId },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId: res.data.id, threadId: res.data.threadId };
};

export const mark_read: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);
  const messageId = render(config.messageId);
  const markAs = render(config.markAs || 'read');
  const body = markAs === 'unread' ? { addLabelIds: ['UNREAD'] } : { removeLabelIds: ['UNREAD'] };
  await axios.post(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    body,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId, markedAs: markAs };
};

export const del: ToolHandler = async ({ config, render, userId }) => {
  const credentialId = requireCred(config, 'Gmail');
  const token = await resolveGoogleToken(credentialId, userId);
  const messageId = render(config.messageId);
  if (!messageId) throw new Error('messageId is required.');
  await axios.delete(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return { success: true, messageId, trashed: true };
};

// ─── Router ──────────────────────────────────────────────────────────────────

const map: Record<string, ToolHandler> = { send, search, get, reply, mark_read, delete: del };

export const handler: ToolHandler = async (ctx) => {
  const singleOp = ctx.config.operation;
  if (singleOp) {
    const h = map[singleOp];
    if (!h) throw new Error(`Unknown Gmail operation: "${singleOp}"`);
    return h(ctx);
  }

  const ops = (ctx.config as any).operations as Array<Record<string, string>> | undefined;
  if (Array.isArray(ops) && ops.length > 0) {
    const results: any[] = [];
    for (const { op, ...opFields } of ops) {
      if (!op) continue;
      const h = map[op];
      if (!h) throw new Error(`Unknown Gmail operation: "${op}"`);
      results.push(await h({ ...ctx, config: { ...ctx.config, ...opFields, operation: op } }));
    }
    return results.length === 1 ? results[0] : { results, count: results.length };
  }
  throw new Error('No operation configured for Gmail.');
};
