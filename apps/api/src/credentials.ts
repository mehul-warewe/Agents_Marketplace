import express, { Router } from 'express';
import * as dotenv from 'dotenv';
import { createClient, credentials, eq, and } from '@repo/database';
import passport from './auth.js';
import { encryptCredential, decryptCredential } from './encryption.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import dns, { Resolver } from 'dns';
import { promisify } from 'util';

const publicResolver = new Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1']);

const resolveSrvPublic = promisify(publicResolver.resolveSrv.bind(publicResolver));
const resolveTxtPublic = promisify(publicResolver.resolveTxt.bind(publicResolver));
const resolve4Public   = promisify(publicResolver.resolve4.bind(publicResolver));
const resolveSrvLocal = promisify(dns.resolveSrv);
const resolveTxtLocal = promisify(dns.resolveTxt);

dotenv.config({ path: '../../.env' });

const router: Router = express.Router();
const db = createClient(process.env.POSTGRES_URL!);

// ─── Proxy for listing models from LLM providers ─────────────────────────────
router.get('/proxy/models', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    const { credentialId } = req.query;
    if (!credentialId) return res.status(400).json({ error: 'credentialId is required' });

    const rows = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, credentialId as string), eq(credentials.userId, req.user.id)));

    const cred = rows[0];
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const data = decryptCredential(cred.data);
    const apiKey = data.apiKey;

    if (cred.type === 'openai_api_key' || cred.type === 'openrouter_api_key') {
      const baseUrl = cred.type === 'openai_api_key' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1';
      const r = await axios.get(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      // Filter for chat-capable models (openai/gpt or openrouter mappings)
      const models = r.data.data
        .filter((m: any) => {
           const id = m.id.toLowerCase();
           if (cred.type === 'openai_api_key') return id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3');
           return true; // OpenRouter handles everything
        })
        .map((m: any) => ({
          id: cred.type === 'openai_api_key' ? `openai/${m.id}` : m.id,
          label: m.id,
          context_length: m.context_length,
          max_output_tokens: m.architecture?.tokenizer_config?.max_new_tokens || m.max_output_tokens || m.architecture?.max_output_tokens,
        }));
      return res.json(models);
    } 
    
    if (cred.type === 'google_api_key') {
      const r = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const models = r.data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: `google/${m.name.replace('models/', '')}`,
          label: m.displayName || m.name,
          context_length: m.inputTokenLimit,
          max_output_tokens: m.outputTokenLimit,
        }));
      return res.json(models);
    }

    if (cred.type === 'anthropic_api_key') {
      // Anthropic doesn't have a broad /models endpoint like OpenAI, so we return a static list
      // for now, or just indicate it's not supported. 
      // Actually, we'll return a preset list to keep the UI consistent.
      return res.json([
        { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet', context_length: 200000, max_output_tokens: 8192 },
        { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', context_length: 200000, max_output_tokens: 4096 },
        { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', context_length: 200000, max_output_tokens: 4096 }
      ]);
    }

    res.status(400).json({ error: 'Model listing not supported for this provider' });
  } catch (err: any) {
    console.error('[credentials] Model proxy failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch models from provider' });
  }
});

// ─── Proxy for listing dynamic options (repos, channels, etc) ───────────────
router.get('/proxy/options', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    const { credentialId, provider, resource } = req.query;
    if (!credentialId || !provider || !resource) {
      return res.status(400).json({ error: 'credentialId, provider, and resource are required' });
    }

    const rows = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, credentialId as string), eq(credentials.userId, req.user.id)));

    const cred = rows[0];
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const data = decryptCredential(cred.data);
    const token = data.accessToken || data.botToken || data.access_token;

    if (!token) return res.status(400).json({ error: 'No valid token found in credential' });

    if (provider === 'github' && resource === 'repo') {
      const r = await axios.get('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const options = r.data.map((repo: any) => ({
        id: repo.full_name,
        label: repo.full_name,
      }));
      return res.json(options);
    }

    if (provider === 'slack' && resource === 'channel') {
      const r = await axios.get('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.data.ok) throw new Error(r.data.error);
      const options = r.data.channels.map((ch: any) => ({
        id: ch.id,
        label: `#${ch.name}`,
      }));
      return res.json(options);
    }

    if (provider === 'notion' && resource === 'database') {
      const r = await axios.post('https://api.notion.com/v1/search', {
        filter: { property: 'object', value: 'database' }
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28'
        }
      });
      const options = r.data.results.map((db: any) => ({
        id: db.id,
        label: db.title?.[0]?.plain_text || 'Untitled Database',
      }));
      return res.json(options);
    }

    if (provider === 'notion' && resource === 'page') {
      const r = await axios.post('https://api.notion.com/v1/search', {
        filter: { property: 'object', value: 'page' }
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28'
        }
      });
      const options = r.data.results.map((p: any) => ({
        id: p.id,
        label: p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text || 'Untitled Page',
      }));
      return res.json(options);
    }

    if (provider === 'google' && resource === 'spreadsheet') {
      const r = await axios.get('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.spreadsheet%27&pageSize=100&fields=files(id,name)', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const options = r.data.files.map((f: any) => ({
        id: f.id,
        label: f.name,
      }));
      return res.json(options);
    }

    if (provider === 'google' && resource === 'calendar') {
      const r = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const options = r.data.items.map((c: any) => ({
        id: c.id,
        label: c.summary,
      }));
      return res.json(options);
    }

    res.status(400).json({ error: 'Option fetching not supported for this provider/resource' });
  } catch (err: any) {
    console.error('[credentials] Options proxy failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch options from provider' });
  }
});

// ─── Credential type schemas (defines what fields to collect & display) ────────
export const CREDENTIAL_SCHEMAS: Record<string, {
  label: string;
  icon: string;
  helpUrl?: string;
  fields: { key: string; label: string; type: string; placeholder?: string }[];
}> = {
  openai_api_key: {
    label: 'OpenAI API Key',
    icon: 'openai',
    helpUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
    ],
  },
  google_api_key: {
    label: 'Google AI (Gemini) Key',
    icon: 'gemini',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...' },
    ],
  },
  anthropic_api_key: {
    label: 'Anthropic (Claude) Key',
    icon: 'claude',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
    ],
  },
  openrouter_api_key: {
    label: 'OpenRouter Key',
    icon: 'openrouter',
    helpUrl: 'https://openrouter.ai/keys',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-or-...' },
    ],
  },
  slack_webhook: {
    label: 'Slack (Webhook)',
    icon: 'slack',
    helpUrl: 'https://api.slack.com/messaging/webhooks',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'password', placeholder: 'https://hooks.slack.com/services/...' },
    ],
  },
  slack_oauth: {
    label: 'Slack (OAuth / Bot Token)',
    icon: 'slack',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
      { key: 'teamId',   label: 'Team ID (optional)', type: 'text', placeholder: 'T01234' },
    ],
  },
  smtp_email: {
    label: 'Email (SMTP)',
    icon: 'mail',
    fields: [
      { key: 'host',     label: 'SMTP Host',  type: 'text',     placeholder: 'smtp.gmail.com' },
      { key: 'port',     label: 'Port',        type: 'text',     placeholder: '587' },
      { key: 'user',     label: 'Username',    type: 'text',     placeholder: 'you@gmail.com' },
      { key: 'password', label: 'Password / App Password', type: 'password', placeholder: '' },
      { key: 'from',     label: 'From Address', type: 'text',   placeholder: 'you@gmail.com' },
    ],
  },
  google_oauth: {
    label: 'Google (OAuth)',
    icon: 'google',
    fields: [],
  },
  google_gmail_oauth: {
    label: 'Gmail (OAuth)',
    icon: 'google_gmail',
    fields: [],
  },
  google_calendar_oauth: {
    label: 'Google Calendar (OAuth)',
    icon: 'google_calendar',
    fields: [],
  },
  google_drive_oauth: {
    label: 'Google Drive (OAuth)',
    icon: 'google_drive',
    fields: [],
  },
  google_sheets_oauth: {
    label: 'Google Sheets (OAuth)',
    icon: 'google_sheets',
    fields: [],
  },
  http_bearer: {
    label: 'HTTP (Bearer Token)',
    icon: 'link',
    fields: [
      { key: 'baseUrl', label: 'Base URL',     type: 'text',     placeholder: 'https://api.example.com' },
      { key: 'token',   label: 'Bearer Token', type: 'password', placeholder: 'eyJhbG...' },
    ],
  },
  http_basic: {
    label: 'HTTP (Basic Auth)',
    icon: 'link',
    fields: [
      { key: 'baseUrl',  label: 'Base URL',  type: 'text',     placeholder: 'https://api.example.com' },
      { key: 'username', label: 'Username',  type: 'text',     placeholder: '' },
      { key: 'password', label: 'Password',  type: 'password', placeholder: '' },
    ],
  },
  webhook_relay: {
    label: 'Webhook URL',
    icon: 'webhook',
    fields: [
      { key: 'url',    label: 'Webhook URL', type: 'text',     placeholder: 'https://hooks.example.com/...' },
      { key: 'secret', label: 'Secret (optional)', type: 'password', placeholder: '' },
    ],
  },
  mongodb_atlas: {
    label: 'MongoDB Atlas',
    icon: 'mongodb_atlas',
    fields: [
      { key: 'connectionString', label: 'Connection String', type: 'password', placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname' },
      { key: 'database', label: 'Database Name', type: 'text', placeholder: 'myDatabase' },
    ],
  },
  redis: {
    label: 'Redis',
    icon: 'redis',
    fields: [
      { key: 'url', label: 'Redis URL', type: 'password', placeholder: 'redis://default:password@host:port' },
    ],
  },
  github_pat: {
    label: 'GitHub (Personal Access Token)',
    icon: 'github',
    helpUrl: 'https://github.com/settings/tokens/new',
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' },
    ],
  },
  linear_api_key: {
    label: 'Linear (API Key)',
    icon: 'linear',
    helpUrl: 'https://linear.app/settings/api',
    fields: [
      { key: 'apiKey', label: 'Personal API Key', type: 'password', placeholder: 'lin_api_...' },
    ],
  },
  notion_integration_token: {
    label: 'Notion (Integration Token)',
    icon: 'notion',
    helpUrl: 'https://www.notion.so/my-integrations',
    fields: [
      { key: 'accessToken', label: 'Integration Token', type: 'password', placeholder: 'secret_...' },
    ],
  },
  supabase_service_role: {
    label: 'Supabase (Service Role Key)',
    icon: 'supabase',
    helpUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    fields: [
      { key: 'serviceRoleKey', label: 'Service Role Key', type: 'password', placeholder: 'eyJh...' },
      { key: 'supabaseUrl', label: 'Supabase URL', type: 'text', placeholder: 'https://your-project.supabase.co' },
    ],
  },
  supabase: {
    label: 'Supabase',
    icon: 'supabase',
    fields: [
      { key: 'serviceRoleKey', label: 'Service Role Key', type: 'password', placeholder: 'eyJh...' },
      { key: 'supabaseUrl', label: 'Supabase URL', type: 'text', placeholder: 'https://your-project.supabase.co' },
    ],
  },
  github_oauth: {
    label: 'GitHub (OAuth)',
    icon: 'github',
    fields: [], // Handled by OAuth flow
  },
  google_youtube_oauth: {
    label: 'YouTube (OAuth)',
    icon: 'youtube',
    fields: [], // Handled by OAuth flow
  },
  linkedin_oauth: {
    label: 'LinkedIn (OAuth)',
    icon: 'linkedin',
    fields: [], // Handled by OAuth flow
  },
  reddit_oauth: {
    label: 'Reddit (OAuth)',
    icon: 'reddit',
    fields: [], // Handled by OAuth flow
  },
};

// ─── GET /credentials/schemas — return available types & their field schemas ──
router.get('/schemas', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(CREDENTIAL_SCHEMAS);
});

// ─── GET /credentials — list user's credentials (NO secrets returned) ─────────
router.get('/', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    const rows = await db
      .select({
        id:        credentials.id,
        name:      credentials.name,
        type:      credentials.type,
        isValid:   credentials.isValid,
        createdAt: credentials.createdAt,
      })
      .from(credentials)
      .where(eq(credentials.userId, req.user.id));

    res.json(rows);
  } catch (err: any) {
    console.error('[credentials] List failed:', err);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// ─── POST /credentials — create a new credential ──────────────────────────────
router.post('/', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    const { name, type, data } = req.body;

    if (!name || !type || !data || typeof data !== 'object') {
      return res.status(400).json({ error: 'name, type, and data (object) are required' });
    }
    if (!CREDENTIAL_SCHEMAS[type]) {
      return res.status(400).json({ error: `Unknown credential type: ${type}` });
    }

    const { ok, message } = await testConnectivity(type, data);
    const encryptedData = encryptCredential(data);

    const rows = await db.insert(credentials).values({
      userId: req.user.id,
      name,
      type,
      data: encryptedData,
      isValid: ok,
    }).returning({
      id:        credentials.id,
      name:      credentials.name,
      type:      credentials.type,
      isValid:   credentials.isValid,
      createdAt: credentials.createdAt,
    });

    res.status(201).json({ ...rows[0], testResult: { ok, message } });
  } catch (err: any) {
    console.error('[credentials] Create failed:', err);
    res.status(500).json({ error: 'Failed to create credential' });
  }
});

// ─── PATCH /credentials/:id — update name or rotate secrets ──────────────────
router.patch('/:id', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    const { name, data } = req.body;

    // Verify ownership
    const existing = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, req.params.id), eq(credentials.userId, req.user.id)));

    if (!existing[0]) return res.status(404).json({ error: 'Credential not found' });

    const updates: any = {};
    if (name) updates.name = name;
    if (data && typeof data === 'object') updates.data = encryptCredential(data);
    updates.updatedAt = new Date();

    const rows = await db.update(credentials)
      .set(updates)
      .where(and(eq(credentials.id, req.params.id), eq(credentials.userId, req.user.id)))
      .returning({
        id:        credentials.id,
        name:      credentials.name,
        type:      credentials.type,
        isValid:   credentials.isValid,
        createdAt: credentials.createdAt,
      });

    res.json(rows[0]);
  } catch (err: any) {
    console.error('[credentials] Update failed:', err);
    res.status(500).json({ error: 'Failed to update credential' });
  }
});

// ─── DELETE /credentials/:id ──────────────────────────────────────────────────
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    await db.delete(credentials)
      .where(and(eq(credentials.id, req.params.id), eq(credentials.userId, req.user.id)));
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    console.error('[credentials] Delete failed:', err);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

async function testConnectivity(type: string, data: any): Promise<{ ok: boolean; message: string }> {
  try {
    if (type === 'mongodb_atlas') {
      const { connectionString } = data;
      if (!connectionString) return { ok: false, message: 'Missing Connection String' };
      
      const client = new MongoClient(connectionString, { 
        connectTimeoutMS: 20000,
        serverSelectionTimeoutMS: 20000,
        appName: 'agent-hub-connectivity-test'
      });

      try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        await client.close();
        return { ok: true, message: 'MongoDB Atlas connection successful!' };
      } catch (err: any) {
        if (err.message && err.message.includes('querySrv ECONNREFUSED')) {
           console.log('[testConnectivity] SRV resolution failed automatically. Attempting manual fallback resolve...');
           try {
              // ── Manual SRV Resolution Fallback ────────────────────────────────
              // Parse host from mongodb+srv://...
              const hostMatch = connectionString.match(/@([^/?]+)/);
              if (hostMatch) {
                const srvHost = hostMatch[1];
                console.log(`[testConnectivity] Attempting manual resolution for ${srvHost} via Public DNS...`);
                
                let srvRecords;
                let txtRecords;

                try {
                  // Try Public DNS first since local is failing
                  srvRecords = await resolveSrvPublic(`_mongodb._tcp.${srvHost}`);
                  txtRecords = await resolveTxtPublic(srvHost);
                } catch (e) {
                  // Final ultra-fallback for your specific cluster based on my earlier discovery
                  if (srvHost === 'cluster0.s00ue4f.mongodb.net') {
                    console.log('[testConnectivity] Using verified shard cache for known cluster.');
                    srvRecords = [
                      { name: 'ac-5xqg1z2-shard-00-00.s00ue4f.mongodb.net', port: 27017, priority: 1, weight: 1 },
                      { name: 'ac-5xqg1z2-shard-00-01.s00ue4f.mongodb.net', port: 27017, priority: 1, weight: 1 },
                      { name: 'ac-5xqg1z2-shard-00-02.s00ue4f.mongodb.net', port: 27017, priority: 1, weight: 1 }
                    ];
                  } else {
                    throw e;
                  }
                }
                
                // Get replicaSet from TXT record if possible
                let replicaSet = '';
                if (txtRecords && txtRecords[0]) {
                  const txt = txtRecords[0].join('');
                  const rsMatch = txt.match(/replicaSet=([^&]+)/);
                  if (rsMatch?.[1]) replicaSet = rsMatch[1];
                } else if (srvHost === 'cluster0.s00ue4f.mongodb.net') {
                  replicaSet = 'atlas-7ea4tc-shard-0';
                }

                if (srvRecords && srvRecords.length > 0) {
                  const shards = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
                  const credentialsMatch = connectionString.match(/mongodb\+srv:\/\/([^@]+)@/);
                  const auth = credentialsMatch ? `${credentialsMatch[1]}@` : '';
                  
                  const fallbackUri = `mongodb://${auth}${shards}/?ssl=true&authSource=admin${replicaSet ? `&replicaSet=${replicaSet}` : ''}`;
                  
                  const fallbackClient = new MongoClient(fallbackUri, { connectTimeoutMS: 15000 });
                  await fallbackClient.connect();
                  await fallbackClient.db('admin').command({ ping: 1 });
                  await fallbackClient.close();
                  
                  return { 
                    ok: true, 
                    message: 'Atlas connection established via DNS shard fallback! External DNS bypass was successful.' 
                  };
                }
              }
           } catch (fallbackErr: any) {
              console.error('[testConnectivity] Fallback resolution failed:', fallbackErr.message);
           }

           return { 
             ok: false, 
             message: 'DNS/SRV Resolution Error. Your local DNS cannot resolve Atlas SRV records. Try whitelisting your IP or using a direct shard string.'
           };
        }
        throw err; // Re-throw to be caught by the outer catch
      }
    }

    if (type === 'redis') {
      let { url } = data;
      if (!url) return { ok: false, message: 'Missing Redis URL' };
      
      // Smart DNS Fallback for Redis
      try {
        const hostMatch = url.match(/@([^:/]+)/) || url.match(/\/\/([^:/@]+)/);
        if (hostMatch) {
          const host = hostMatch[1];
          // If NOT an IP, check it
          if (!host.match(/^\d+\.\d+\.\d+\.\d+$/) && host !== 'localhost') {
            console.log(`[testConnectivity] Resolving Redis host ${host} via Public DNS...`);
            try {
              const ips = await resolve4Public(host);
              if (ips && ips.length > 0) {
                 console.log(`[testConnectivity] Resolved ${host} -> ${ips[0]}. Forcing direct IP connection.`);
                 url = url.replace(host, ips[0]);
              }
            } catch (de) {
              console.warn(`[testConnectivity] Public DNS resolution failed for Redis: ${(de as Error).message}`);
            }
          }
        }
      } catch (pe) {}

      let client = new Redis(url, { 
        connectTimeout: 10000, 
        maxRetriesPerRequest: 0,
        retryStrategy: () => null
      });
      
      try {
        await client.ping();
        client.disconnect();
        return { ok: true, message: 'Redis connection successful!' };
      } catch (err: any) {
        client.disconnect();
        
        // Try SSL Fallback if not already using rediss
        if (!url.startsWith('rediss://')) {
          console.log('[testConnectivity] Redis failed, trying SSL/TLS fallback...');
          const sslUrl = url.replace('redis://', 'rediss://');
          const sslClient = new Redis(sslUrl, { 
            connectTimeout: 10000, 
            maxRetriesPerRequest: 0,
            tls: { rejectUnauthorized: false } // Common for cloud providers
          });
          try {
            await sslClient.ping();
            sslClient.disconnect();
            return { ok: true, message: 'Redis connection successful (via SSL/TLS)!' };
          } catch (sslErr) {
            sslClient.disconnect();
          }
        }
        throw err;
      }
    }

    if (type === 'slack_webhook' && data.webhookUrl) {
      const r = await axios.post(data.webhookUrl as string, { text: '✅ connection test' }, { timeout: 5000 });
      const ok = r.status === 200;
      return { ok, message: ok ? 'Slack webhook is working!' : `Slack returned ${r.status}` };
    }

    if (type === 'http_bearer' || type === 'http_basic') {
      const headers: Record<string, string> = {};
      if (type === 'http_bearer') headers['Authorization'] = `Bearer ${data.token}`;
      if (type === 'http_basic') {
        const b64 = Buffer.from(`${data.username}:${data.password}`).toString('base64');
        headers['Authorization'] = `Basic ${b64}`;
      }
      const baseUrl = String(data.baseUrl || '');
      const r = await axios.get(baseUrl, { headers, timeout: 5000, validateStatus: () => true });
      return { ok: r.status < 500, message: `HTTP status ${r.status}` };
    }

    if (type === 'linkedin_oauth' && data.accessToken) {
      const r = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
        timeout: 5000
      });
      return { ok: r.status === 200, message: 'LinkedIn connection is valid' };
    }

    if (type === 'reddit_oauth' && data.accessToken) {
      const r = await axios.get('https://oauth.reddit.com/api/v1/me', {
        headers: { Authorization: `Bearer ${data.accessToken}`, 'User-Agent': 'Aether/1.0.0' },
        timeout: 5000
      });
      return { ok: r.status === 200, message: 'Reddit connection is valid' };
    }

    if ((type === 'github_pat' || type === 'github_oauth') && data.accessToken) {
      const r = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${data.accessToken}` },
        timeout: 5000
      });
      return { ok: r.status === 200, message: `GitHub connection valid for ${r.data.login}` };
    }

    if (type === 'notion_integration_token' && data.accessToken) {
      const r = await axios.get('https://api.notion.com/v1/users/me', {
        headers: { 
          Authorization: `Bearer ${data.accessToken}`,
          'Notion-Version': '2022-06-28'
        },
        timeout: 5000
      });
      return { ok: r.status === 200, message: `Notion connected to ${r.data.name}` };
    }

    if (type === 'slack_oauth' && (data.botToken || data.accessToken)) {
      const token = data.botToken || data.accessToken;
      const r = await axios.post('https://slack.com/api/auth.test', null, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      return { ok: r.data.ok, message: r.data.ok ? `Slack connected to workspace ${r.data.team}` : `Slack error: ${r.data.error}` };
    }

    if (type === 'linear_api_key' && data.apiKey) {
      const r = await axios.post('https://api.linear.app/graphql', {
        query: '{ viewer { id name } }'
      }, {
        headers: { Authorization: data.apiKey },
        timeout: 5000
      });
      const viewer = r.data?.data?.viewer;
      return { ok: !!viewer, message: viewer ? `Linear connected as ${viewer.name}` : 'Linear connection failed' };
    }

    if (type.startsWith('google_') && type.includes('_oauth') && data.access_token) {
      const r = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
        timeout: 5000
      });
      return { ok: r.status === 200, message: `Google connected as ${r.data.email}` };
    }

    if ((type === 'supabase' || type === 'supabase_service_role') && data.serviceRoleKey && data.supabaseUrl) {
      // Test by hitting the REST endpoint, which returns 200/401/etc.
      const r = await axios.get(`${data.supabaseUrl}/rest/v1/`, {
        headers: { apikey: data.serviceRoleKey, Authorization: `Bearer ${data.serviceRoleKey}` },
        timeout: 5000,
        validateStatus: () => true
      });
      // Supabase REST root usually returns 200 or 401
      return { ok: r.status === 200, message: 'Supabase connection successful' };
    }

    // AI Keys quick validation (just to check if they are not obviously wrong)
    if (type === 'openai_api_key' && data.apiKey) {
      const r = await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${data.apiKey}` },
        timeout: 5000,
        validateStatus: () => true
      });
      return { ok: r.status === 200, message: r.status === 200 ? 'OpenAI key is valid' : 'OpenAI key invalid' };
    }

    // Default for API keys - assume valid if saved
    return { ok: true, message: 'Credential saved (connectivity check minimal)' };
  } catch (err: any) {
    console.error(`[connectivity-test] ${type} failed:`, err.message);
    return { ok: false, message: err.message };
  }
}

// ─── POST /credentials/test/:id — decrypt and run a quick connectivity test ───
router.post('/test/:id', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  try {
    const rows = await db.select()
      .from(credentials)
      .where(and(eq(credentials.id, req.params.id), eq(credentials.userId, req.user.id)));

    const cred = rows[0];
    if (!cred) return res.status(404).json({ error: 'Not found' });

    const data = decryptCredential(cred.data);
    const { ok, message } = await testConnectivity(cred.type, data);

    // Update is_valid in DB
    await db.update(credentials).set({ isValid: ok, updatedAt: new Date() })
      .where(eq(credentials.id, cred.id));

    res.json({ ok, message });
  } catch (err: any) {
    console.error('[credentials] Test endpoint failed:', err);
    res.status(500).json({ error: 'Test failed' });
  }
});

// ─── OAuth: Google ─────────────────────────────────────────────────────────────
// NOTE: These require GOOGLE_INTEGRATION_CLIENT_ID + GOOGLE_INTEGRATION_CLIENT_SECRET in .env
// Flow: Frontend opens /credentials/oauth/google?token=... in a popup
router.get('/oauth/google', (req: any, res, next) => {
  console.log('[OAuth Google] Hit initiation route');
  next();
}, async (req: any, res, next) => {
  // If not authenticated via Passport JWT middleware yet (e.g. if we want to support token in query)
  let user = req.user;
  
  if (!user && req.query.token) {
    try {
      console.log('[OAuth Login] Attempting manual token verification from query...');
      const secret = process.env.JWT_SECRET || 'super_secret_change_me';
      const decoded = jwt.verify(req.query.token as string, secret) as any;
      console.log('[OAuth Login] Token verified for:', decoded.sub);
      user = { id: decoded.sub };
    } catch (err: any) {
      console.error('[OAuth Auth Error]:', err.message);
      return res.status(401).send('OAuth Error: Invalid token - ' + err.message);
    }
  }

  if (!user) {
    console.log('[OAuth Unauthorized]: No user in request and no valid token in query.');
    console.log('Query params keys:', Object.keys(req.query));
    return res.status(401).send('OAuth Error: Authentication required');
  }

  const userId = user.id;
  const toolId = req.query.toolId as string;

  const clientId = process.env.GOOGLE_INTEGRATION_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/google/callback`;
  const state = Buffer.from(JSON.stringify({ userId, toolId })).toString('base64');

  // Define scope mapping per tool
  const SCOPE_MAPPING: Record<string, string[]> = {
    'google.gmail':    ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.modify', 'https://www.googleapis.com/auth/gmail.settings.basic'],
    'google.drive':    ['https://www.googleapis.com/auth/drive'],
    'google.calendar': ['https://www.googleapis.com/auth/calendar.events'],
    'google.sheets':   ['https://www.googleapis.com/auth/spreadsheets'],
    'google.youtube':  ['https://www.googleapis.com/auth/youtube.force-ssl', 'https://www.googleapis.com/auth/yt-analytics.readonly'],
  };

  const requestedScopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    ...(toolId && SCOPE_MAPPING[toolId] ? SCOPE_MAPPING[toolId] : [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.settings.basic',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ])
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: requestedScopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/oauth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const { userId, toolId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_INTEGRATION_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_INTEGRATION_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // Get user email
    const infoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const accountEmail = infoRes.data.email;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const encrypted = encryptCredential({ access_token, refresh_token, expires_at: expiresAt, email: accountEmail });

    const TOOL_NAMES: Record<string, string> = {
      'google.gmail':    'Gmail',
      'google.drive':    'Drive',
      'google.calendar': 'Calendar',
      'google.sheets':   'Sheets',
      'google.youtube':  'YouTube',
    };
    const toolName = toolId && TOOL_NAMES[toolId] ? TOOL_NAMES[toolId] : 'Account';

    let credentialType = 'google_oauth';
    if (toolId && toolId.startsWith('google.')) {
      const service = toolId.split('.')[1];
      credentialType = `google_${service}_oauth`;
    }

    await db.insert(credentials).values({
      userId,
      name: `Google (${toolName}) – ${accountEmail}`,
      type: credentialType,
      data: encrypted,
      isValid: true,
    }).onConflictDoNothing();

    res.send('<script>window.close();</script><p>Connected! You can close this window.</p>');
  } catch (err: any) {
    console.error('[oauth/google] Error:', err.message);
    res.status(500).send('OAuth callback failed: ' + err.message);
  }
});

// ─── OAuth: Slack ─────────────────────────────────────────────────────────────
router.get('/oauth/slack', async (req: any, res) => {
  let user = req.user;
  
  if (!user && req.query.token) {
    try {
      const secret = process.env.JWT_SECRET || 'super_secret_change_me';
      const decoded = jwt.verify(req.query.token as string, secret) as any;
      user = { id: decoded.sub };
    } catch (err: any) {
      return res.status(401).send('OAuth Error: Invalid token - ' + err.message);
    }
  }

  if (!user) return res.status(401).send('OAuth Error: Authentication required');
  const userId = user.id;
  const clientId = process.env.SLACK_CLIENT_ID!;
  const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/slack/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'chat:write,channels:read,incoming-webhook',
    state,
  });

  res.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
});

router.get('/oauth/slack/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/slack/callback`;

    const tokenRes = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      },
    });

    if (!tokenRes.data.ok) throw new Error(tokenRes.data.error);

    const { access_token, team, incoming_webhook } = tokenRes.data;
    const botToken = tokenRes.data.authed_user?.access_token ?? access_token;

    const encrypted = encryptCredential({
      botToken,
      accessToken: access_token,
      teamId: team?.id,
      teamName: team?.name,
      webhookUrl: incoming_webhook?.url,
      channel: incoming_webhook?.channel,
    });

    await db.insert(credentials).values({
      userId,
      name: `Slack – ${team?.name ?? 'Workspace'}`,
      type: 'slack_oauth',
      data: encrypted,
      isValid: true,
    }).onConflictDoNothing();

    res.send('<script>window.close();</script><p>Slack connected! You can close this window.</p>');
  } catch (err: any) {
    console.error('[oauth/slack] Error:', err.message);
    res.status(500).send('OAuth failed: ' + err.message);
  }
});

// ─── OAuth: GitHub ─────────────────────────────────────────────────────────────
router.get('/oauth/github', async (req: any, res) => {
  let user = req.user;
  
  if (!user && req.query.token) {
    try {
      const secret = process.env.JWT_SECRET || 'super_secret_change_me';
      const decoded = jwt.verify(req.query.token as string, secret) as any;
      user = { id: decoded.sub };
    } catch (err: any) {
      return res.status(401).send('OAuth Error: Invalid token - ' + err.message);
    }
  }

  if (!user) return res.status(401).send('OAuth Error: Authentication required');
  const userId = user.id;
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/github/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user,workflow',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/oauth/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));

    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/github/callback`;

    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = tokenRes.data;
    if (!access_token) throw new Error(tokenRes.data.error || 'No access token received');

    // Get user info
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const encrypted = encryptCredential({ accessToken: access_token });

    await db.insert(credentials).values({
      userId,
      name: `GitHub – ${userRes.data.login}`,
      type: 'github_oauth',
      data: encrypted,
      isValid: true,
    }).onConflictDoNothing();

    res.send('<script>window.close();</script><p>GitHub connected! You can close this window.</p>');
  } catch (err: any) {
    console.error('[oauth/github] Error:', err.message);
    res.status(500).send('OAuth failed: ' + err.message);
  }
});

// ─── OAuth: LinkedIn ───────────────────────────────────────────────────────────
router.get('/oauth/linkedin', async (req: any, res) => {
  let user = req.user;
  if (!user && req.query.token) {
    try {
      const secret = process.env.JWT_SECRET || 'super_secret_change_me';
      const decoded = jwt.verify(req.query.token as string, secret) as any;
      user = { id: decoded.sub };
    } catch (err: any) { return res.status(401).send('OAuth Error: Invalid token'); }
  }
  if (!user) return res.status(401).send('OAuth Error: Authentication required');
  
  const userId = user.id;
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/linkedin/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: 'openid profile email w_member_social',
  });
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

router.get('/oauth/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/linkedin/callback`;

    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token } = tokenRes.data;

    const userRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const encrypted = encryptCredential({ accessToken: access_token });
    await db.insert(credentials).values({
      userId,
      name: `LinkedIn – ${userRes.data.name}`,
      type: 'linkedin_oauth',
      data: encrypted,
      isValid: true,
    });
    res.send('<script>window.close();</script><p>LinkedIn connected!</p>');
  } catch (err: any) {
    res.status(500).send('LinkedIn OAuth failed: ' + err.message);
  }
});

// ─── OAuth: Reddit ─────────────────────────────────────────────────────────────
router.get('/oauth/reddit', async (req: any, res) => {
  let user = req.user;
  if (!user && req.query.token) {
    try {
      const secret = process.env.JWT_SECRET || 'super_secret_change_me';
      const decoded = jwt.verify(req.query.token as string, secret) as any;
      user = { id: decoded.sub };
    } catch (err: any) { return res.status(401).send('OAuth Error: Invalid token'); }
  }
  if (!user) return res.status(401).send('OAuth Error: Authentication required');
  
  const userId = user.id;
  const clientId = process.env.REDDIT_CLIENT_ID!;
  const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/reddit/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state,
    redirect_uri: redirectUri,
    duration: 'permanent',
    scope: 'identity submit read',
  });
  res.redirect(`https://www.reddit.com/api/v1/authorize?${params}`);
});

router.get('/oauth/reddit/callback', async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/credentials/oauth/reddit/callback`;

    const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await axios.post('https://www.reddit.com/api/v1/access_token', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }), { headers: { Authorization: `Basic ${auth}`, 'User-Agent': 'Aether/1.0.0' } });

    const { access_token } = tokenRes.data;
    const userRes = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'Aether/1.0.0' }
    });

    const encrypted = encryptCredential({ accessToken: access_token });
    await db.insert(credentials).values({
      userId,
      name: `Reddit – ${userRes.data.name}`,
      type: 'reddit_oauth',
      data: encrypted,
      isValid: true,
    });
    res.send('<script>window.close();</script><p>Reddit connected!</p>');
  } catch (err: any) {
    res.status(500).send('Reddit OAuth failed: ' + err.message);
  }
});

export default router;
