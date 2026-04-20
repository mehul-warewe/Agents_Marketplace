import axios from 'axios';
import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import { Resolver } from 'dns';
import { promisify } from 'util';
import { log } from '../../shared/logger.js';

const publicResolver = new Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1']);

const resolveSrvPublic = promisify(publicResolver.resolveSrv.bind(publicResolver));
const resolveTxtPublic = promisify(publicResolver.resolveTxt.bind(publicResolver));
const resolve4Public   = promisify(publicResolver.resolve4.bind(publicResolver));

/** Sanitize sensitive info from strings (passwords in URLs, etc) */
export function sanitize(input: any): any {
  if (!input) return input;
  if (typeof input !== 'string') {
    try {
      const str = typeof input === 'object' ? JSON.stringify(input) : String(input);
      return str.replace(/:[^:@/]+@/g, ':****@');
    } catch { return '[Circular or Non-Serializable Object]'; }
  }
  return input.replace(/:[^:@/]+@/g, ':****@');
}

export async function testConnectivity(type: string, data: any): Promise<{ ok: boolean; message: string }> {
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
           log.info('[testConnectivity] SRV resolution failed automatically. Attempting manual fallback resolve...');
           try {
              // Parse host from mongodb+srv://...
              const hostMatch = connectionString.match(/@([^/?]+)/);
              if (hostMatch) {
                const srvHost = hostMatch[1];
                log.info(`[testConnectivity] Attempting manual resolution for ${srvHost} via Public DNS...`);
                
                let srvRecords;
                let txtRecords;

                try {
                  srvRecords = await resolveSrvPublic(`_mongodb._tcp.${srvHost}`);
                  txtRecords = await resolveTxtPublic(srvHost);
                } catch (e) {
                  // Specific cluster cache for known cluster
                  if (srvHost === 'cluster0.s00ue4f.mongodb.net') {
                    srvRecords = [
                      { name: 'ac-5xqg1z2-shard-00-00.s00ue4f.mongodb.net', port: 27017, priority: 1, weight: 1 },
                      { name: 'ac-5xqg1z2-shard-00-01.s00ue4f.mongodb.net', port: 27017, priority: 1, weight: 1 },
                      { name: 'ac-5xqg1z2-shard-00-02.s00ue4f.mongodb.net', port: 27017, priority: 1, weight: 1 }
                    ];
                  } else {
                    throw e;
                  }
                }
                
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
                  
                  return { ok: true, message: 'Atlas connection established via DNS shard fallback!' };
                }
              }
           } catch (fallbackErr: any) {
              log.error('[testConnectivity] Fallback resolution failed:', sanitize(fallbackErr.message));
           }
           return { ok: false, message: 'DNS/SRV Resolution Error.' };
        }
        throw err;
      }
    }

    if (type === 'redis') {
      let { url } = data;
      if (!url) return { ok: false, message: 'Missing Redis URL' };
      
      try {
        const hostMatch = url.match(/@([^:/]+)/) || url.match(/\/\/([^:/@]+)/);
        if (hostMatch) {
          const host = hostMatch[1];
          if (!host.match(/^\d+\.\d+\.\d+\.\d+$/) && host !== 'localhost') {
            try {
              const ips = await resolve4Public(host);
              if (ips && ips.length > 0) {
                 url = url.replace(host, ips[0]);
              }
            } catch (de) {}
          }
        }
      } catch (pe) {}

      let client = new Redis(url, { connectTimeout: 10000, maxRetriesPerRequest: 0, retryStrategy: () => null });
      try {
        await client.ping();
        client.disconnect();
        return { ok: true, message: 'Redis connection successful!' };
      } catch (err: any) {
        client.disconnect();
        if (!url.startsWith('rediss://')) {
          const sslUrl = url.replace('redis://', 'rediss://');
          const sslClient = new Redis(sslUrl, { connectTimeout: 10000, maxRetriesPerRequest: 0, tls: { rejectUnauthorized: false } });
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
      const r = await axios.post(data.webhookUrl, { text: '✅ connection test' }, { timeout: 5000 });
      return { ok: r.status === 200, message: r.status === 200 ? 'Slack webhook working!' : `Status ${r.status}` };
    }

    if (type === 'http_bearer' || type === 'http_basic') {
      const headers: Record<string, string> = {};
      if (type === 'http_bearer') headers['Authorization'] = `Bearer ${data.token}`;
      if (type === 'http_basic') {
        headers['Authorization'] = `Basic ${Buffer.from(`${data.username}:${data.password}`).toString('base64')}`;
      }
      const r = await axios.get(data.baseUrl, { headers, timeout: 5000, validateStatus: () => true });
      return { ok: r.status < 500, message: `Status ${r.status}` };
    }

    if (type === 'slack_oauth' && (data.botToken || data.accessToken)) {
      const token = data.botToken || data.accessToken;
      const r = await axios.post('https://slack.com/api/auth.test', null, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      return { ok: r.data.ok, message: r.data.ok ? `Slack connected to ${r.data.team}` : `Error: ${r.data.error}` };
    }

    if (type === 'linear_api_key' && data.apiKey) {
      const r = await axios.post('https://api.linear.app/graphql', { query: '{ viewer { name } }' }, {
        headers: { Authorization: data.apiKey },
        timeout: 5000
      });
      return { ok: !!r.data?.data?.viewer, message: r.data?.data?.viewer ? `Connected as ${r.data.data.viewer.name}` : 'Failed' };
    }

    if (type.startsWith('google_') && type.includes('_oauth') && data.access_token) {
      const r = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
        timeout: 5000
      });
      return { ok: r.status === 200, message: `Google connected as ${r.data.email}` };
    }

    if (type === 'supabase_service_role' && data.serviceRoleKey && data.supabaseUrl) {
      const r = await axios.get(`${data.supabaseUrl}/rest/v1/`, {
        headers: { apikey: data.serviceRoleKey, Authorization: `Bearer ${data.serviceRoleKey}` },
        timeout: 5000,
        validateStatus: () => true
      });
      return { ok: r.status === 200, message: 'Supabase success' };
    }

    if (type === 'openai_api_key' && data.apiKey) {
      const r = await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${data.apiKey}` },
        timeout: 5000,
        validateStatus: () => true
      });
      return { ok: r.status === 200, message: r.status === 200 ? 'Valid' : 'Invalid OpenAI Key' };
    }

    if (type === 'google_api_key' && data.apiKey) {
      // Gemini verification: call listModels
      const r = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${data.apiKey}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      return { ok: r.status === 200, message: r.status === 200 ? 'Valid' : 'Invalid Gemini Key' };
    }

    if (type === 'anthropic_api_key' && data.apiKey) {
      // Anthropic does not have a simple naked list models endpoint that works without specific headers
      // We'll try a dummy request to their models list
      const r = await axios.get('https://api.anthropic.com/v1/models', {
        headers: { 
          'x-api-key': data.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      return { ok: r.status === 200, message: r.status === 200 ? 'Valid' : 'Invalid Anthropic Key' };
    }

    if (type === 'openrouter_api_key' && data.apiKey) {
      const r = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${data.apiKey}` },
        timeout: 5000,
        validateStatus: () => true
      });
      return { ok: r.status === 200, message: r.status === 200 ? 'Valid' : 'Invalid OpenRouter Key' };
    }

    return { ok: true, message: 'Credential saved' };
  } catch (err: any) {
    const safeMsg = sanitize(err.message);
    log.error(`[connectivity-test] ${type} failed:`, safeMsg);
    return { ok: false, message: safeMsg };
  }
}
