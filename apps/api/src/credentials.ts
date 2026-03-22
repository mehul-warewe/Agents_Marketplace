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
      // OpenAI and OpenRouter have slightly different structures for the data array
      const models = r.data.data.map((m: any) => ({
        id: m.id,
        label: m.id,
      }));
      return res.json(models);
    } 
    
    if (cred.type === 'google_api_key') {
      const r = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const models = r.data.models.map((m: any) => ({
        id: m.name.replace('models/', ''),
        label: m.displayName || m.name,
      }));
      return res.json(models);
    }

    if (cred.type === 'anthropic_api_key') {
      // Anthropic doesn't have a broad /models endpoint like OpenAI, so we return a static list
      // for now, or just indicate it's not supported. 
      // Actually, we'll return a preset list to keep the UI consistent.
      return res.json([
        { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
      ]);
    }

    res.status(400).json({ error: 'Model listing not supported for this provider' });
  } catch (err: any) {
    console.error('[credentials] Model proxy failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch models from provider' });
  }
});

// ─── Credential type schemas (defines what fields to collect & display) ────────
export const CREDENTIAL_SCHEMAS: Record<string, {
  label: string;
  icon: string;
  fields: { key: string; label: string; type: string; placeholder?: string }[];
}> = {
  openai_api_key: {
    label: 'OpenAI API Key',
    icon: 'openai',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
    ],
  },
  google_api_key: {
    label: 'Google AI (Gemini) Key',
    icon: 'gemini',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...' },
    ],
  },
  anthropic_api_key: {
    label: 'Anthropic (Claude) Key',
    icon: 'claude',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
    ],
  },
  openrouter_api_key: {
    label: 'OpenRouter Key',
    icon: 'openrouter',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-or-...' },
    ],
  },
  slack_webhook: {
    label: 'Slack (Webhook)',
    icon: 'slack',
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
    fields: [], // OAuth-only — no manual fields, handled via callback
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
    icon: 'database',
    fields: [
      { key: 'connectionString', label: 'Connection String', type: 'password', placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname' },
      { key: 'database', label: 'Database Name', type: 'text', placeholder: 'myDatabase' },
    ],
  },
  redis: {
    label: 'Redis',
    icon: 'database',
    fields: [
      { key: 'url', label: 'Redis URL', type: 'password', placeholder: 'redis://default:password@host:port' },
    ],
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

    // Default for API keys - assume valid if saved
    return { ok: true, message: 'Credential saved (connectivity check not applicable)' };
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
    'google.gmail':    ['https://www.googleapis.com/auth/gmail.modify'],
    'google.drive':    ['https://www.googleapis.com/auth/drive'],
    'google.calendar': ['https://www.googleapis.com/auth/calendar.events'],
    'google.sheets':   ['https://www.googleapis.com/auth/spreadsheets'],
    'google.youtube':  ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly'],
  };

  const requestedScopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    ...(toolId && SCOPE_MAPPING[toolId] ? SCOPE_MAPPING[toolId] : [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/youtube.readonly',
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

export default router;
