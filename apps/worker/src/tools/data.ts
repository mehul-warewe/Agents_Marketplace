import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import { ToolHandler } from './index.js';
import dns, { Resolver } from 'dns';
import { promisify } from 'util';

const publicResolver = new Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1']);

const resolveSrvPublic = promisify(publicResolver.resolveSrv.bind(publicResolver));
const resolveTxtPublic = promisify(publicResolver.resolveTxt.bind(publicResolver));
const resolve4Public   = promisify(publicResolver.resolve4.bind(publicResolver));
const resolveSrvLocal = promisify(dns.resolveSrv);
const resolveTxtLocal = promisify(dns.resolveTxt);

const parseJson = (str: string, render: any) => {
  try { return JSON.parse(render(str || '{}')); }
  catch { return {}; }
};

export const mongoClients = new Map<string, MongoClient>();
export const redisClients = new Map<string, Redis>();

/**
 * Edit Data Node handler.
 * Takes incoming data and applies assignments.
 * Assignments use the 'filter' UI structure for convenience:
 * leftValue = target key
 * rightValue = source template (like {input.success})
 */
export const dataEdit: ToolHandler = async ({ config, incomingData, render }) => {
  const { assignments } = config;
  
  if (!assignments || !assignments.conditions || !Array.isArray(assignments.conditions)) {
    return incomingData;
  }

  const result: Record<string, any> = { ...incomingData };

  for (const assign of assignments.conditions) {
    const key = String(render(assign.leftValue || '')).trim();
    if (!key) continue;

    const val = render(assign.rightValue || '');
    
    // Attempt to parse JSON if it looks like it, otherwise use raw
    try {
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
         result[key] = JSON.parse(val);
      } else {
         result[key] = val;
      }
    } catch {
      result[key] = val;
    }
  }

  return result;
};

/**
 * MongoDB Atlas Node handler.
 */
export async function getConnectedMongoClient(connectionString: string): Promise<MongoClient> {
  let client = mongoClients.get(connectionString);
  if (!client) {
    try {
      client = new MongoClient(connectionString, {
        connectTimeoutMS: 20000,
        serverSelectionTimeoutMS: 20000,
        appName: 'agent-hub-worker'
      });
      await client.connect();
    } catch (err: any) {
      // Fallback for SRV resolution failure
      if (err.message && err.message.includes('querySrv ECONNREFUSED') && connectionString.startsWith('mongodb+srv://')) {
        console.warn('[mongo-worker] SRV failure, attempting manual shard resolution...');
        try {
          const hostMatch = connectionString.match(/@([^/?]+)/);
          const credsMatch = connectionString.match(/mongodb\+srv:\/\/([^@]+)@/);
          if (hostMatch && credsMatch) {
             const srvHost = hostMatch[1];
             const auth = credsMatch[1];
             const records = await resolveSrvPublic(`_mongodb._tcp.${srvHost}`);
             if (records && records.length > 0) {
                const shards = records.map(r => `${r.name}:${r.port}`).join(',');
                const fallbackUri = `mongodb://${auth}@${shards}/?ssl=true&authSource=admin`;
                client = new MongoClient(fallbackUri, { connectTimeoutMS: 20000 });
                await client.connect();
                console.info('[mongo-worker] Success using manual shard fallback via public DNS.');
             }
          }
        } catch (fErr) {
          console.error('[mongo-worker] Shard fallback also failed:', (fErr as Error).message);
          throw err;
        }
      }
      if (!client) throw err;
    }
    mongoClients.set(connectionString, client);
  }
  return client;
}

export async function getConnectedRedisClient(url: string): Promise<Redis> {
  let finalUrl = url;
  let client = redisClients.get(finalUrl);
  if (!client) {
    // Smart DNS Fallback for Redis
    try {
      const hostMatch = url.match(/@([^:/]+)/) || url.match(/\/\/([^:/@]+)/);
      const host = hostMatch ? hostMatch[1] : null;
      if (typeof host === 'string' && !host.match(/^\d+\.\d+\.\d+\.\d+$/) && host !== 'localhost') {
           const ips = await resolve4Public(host).catch(() => []);
           if (ips && ips.length > 0) {
              finalUrl = finalUrl.replace(host as string, ips[0] as string);
           }
      }
    } catch (pe) {}

    try {
      client = new Redis(finalUrl, {
        connectTimeout: 15000,
        maxRetriesPerRequest: null,
        lazyConnect: false,
      });
      await client.ping();
    } catch (err: any) {
      if (!finalUrl.startsWith('rediss://')) {
        try {
          const sslUrl = finalUrl.replace('redis://', 'rediss://');
          const sslClient = new Redis(sslUrl, { connectTimeout: 15000, tls: { rejectUnauthorized: false } });
          await sslClient.ping();
          client = sslClient;
          console.info('[redis-worker] Redis SSL/TLS fallback successful.');
        } catch {
          if (client) client.disconnect();
          throw err;
        }
      } else {
        throw err;
      }
    }
    if (!client) throw new Error('Failed to initialize Redis client');
    redisClients.set(url, client);
  }
  return client;
}

/**
 * MongoDB Atlas Node handler.
 */
export const mongodbAtlas: ToolHandler = async ({ config, credentials, render }) => {
  const { operation, collection, document, query } = config;
  const { connectionString, database } = credentials || {};

  if (!connectionString) throw new Error('MongoDB Connection String is required. Check credentials.');

  const client = await getConnectedMongoClient(connectionString);
  const db = client.db(database);
  const coll = db.collection(collection || 'default');

  // Memory Mode Fallback: If no operation is set, or if we want to act as history provider
  if (!operation) {
    const records = await coll.find({ userId: render('{{userId}}') })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    return { memory: records.map(r => r.content || r.message).reverse().join('\n') };
  }

  switch (operation) {
    case 'insertOne':        return await coll.insertOne(parseJson(document, render));
    case 'findOne':          return await coll.findOne(parseJson(document, render));
    case 'findMany':         return await coll.find(parseJson(query, render)).toArray();
    case 'updateOne':        return await coll.updateOne(parseJson(query, render), { $set: parseJson(document, render) });
    case 'deleteOne':        return await coll.deleteOne(parseJson(document, render));
    case 'upsert':           return await coll.updateOne(parseJson(query, render), { $set: parseJson(document, render) }, { upsert: true });
    case 'createCollection': return await db.createCollection(render(collection));
    case 'listCollections':  return await db.listCollections().toArray();
    case 'count':            return { count: await coll.countDocuments(parseJson(query, render)) };
    default: throw new Error(`Unknown MongoDB operation: ${operation}`);
  }
};

/**
 * Redis Node handler.
 */
export const redis: ToolHandler = async ({ config, credentials, render }) => {
  const { operation, key, value, ttl } = config;
  const { url } = credentials || {};

  if (!url) throw new Error('Redis URL is required. Check credentials.');

  const client = await getConnectedRedisClient(url);

  const finalKey = render(key || `history:{{userId}}`);
  const finalVal = value ? render(value) : '';

  // Memory Mode Fallback
  if (!operation) {
    const memory = await client.get(finalKey);
    return { memory: memory || '[No history found in Redis]' };
  }

  switch (operation) {
    case 'get':  return await client.get(finalKey);
    case 'set': 
      if (ttl) return await client.set(finalKey, finalVal, 'EX', parseInt(render(ttl)));
      return await client.set(finalKey, finalVal);
    case 'del':  return await client.del(finalKey);
    case 'incr': return await client.incr(finalKey);
    case 'hset': return await client.hset(finalKey, parseJson(value, render));
    case 'hget': return await client.hgetall(finalKey);
    case 'lpush': return await client.lpush(finalKey, finalVal);
    case 'lrange': return await client.lrange(finalKey, 0, -1);
    default: throw new Error(`Unknown Redis operation: ${operation}`);
  }
};
