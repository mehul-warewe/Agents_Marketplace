import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import dns, { Resolver } from 'dns';
import { promisify } from 'util';

const publicResolver = new Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1']);

const resolveSrvPublic = promisify(publicResolver.resolveSrv.bind(publicResolver));
const resolve4Public   = promisify(publicResolver.resolve4.bind(publicResolver));

export const mongoClients = new Map<string, MongoClient>();
export const redisClients = new Map<string, Redis>();

export async function getConnectedMongoClient(connectionString: string): Promise<MongoClient> {
  let client = mongoClients.get(connectionString);
  if (!client) {
    client = new MongoClient(connectionString, {
      connectTimeoutMS: 20000,
      serverSelectionTimeoutMS: 20000,
      appName: 'agent-hub-worker'
    });
    try {
      await client.connect();
    } catch (err: any) {
      if (err.message?.includes('querySrv ECONNREFUSED') && connectionString.startsWith('mongodb+srv://')) {
        const hostMatch = connectionString.match(/@([^/?]+)/);
        const credsMatch = connectionString.match(/mongodb\+srv:\/\/([^@]+)@/);
        if (hostMatch && credsMatch) {
           const srvHost = hostMatch[1]!;
           const auth = credsMatch[1]!;
           const records = await resolveSrvPublic(`_mongodb._tcp.${srvHost}`);
           if (records && records.length > 0) {
              const shards = records.map(r => `${r.name}:${r.port}`).join(',');
              const fallbackUri = `mongodb://${auth}@${shards}/?ssl=true&authSource=admin`;
              client = new MongoClient(fallbackUri, { connectTimeoutMS: 20000 });
              await client.connect();
           }
        }
      } else throw err;
    }
    mongoClients.set(connectionString, client!);
  }
  return client!;
}

export async function getConnectedRedisClient(url: string): Promise<Redis> {
  let finalUrl = url;
  let client = redisClients.get(finalUrl);
  if (!client) {
    try {
      const hostMatch = url.match(/@([^:/]+)/) || url.match(/\/\/([^:/@]+)/);
      const host = hostMatch ? hostMatch[1] : null;
      if (host && !host.match(/^\d+\.\d+\.\d+\.\d+$/) && host !== 'localhost') {
           const ips = await resolve4Public(host).catch(() => []);
           if (ips && ips.length > 0) finalUrl = finalUrl.replace(host, ips[0]!);
      }
    } catch (pe) {}

    client = new Redis(finalUrl, { connectTimeout: 15000, maxRetriesPerRequest: null, lazyConnect: false });
    try {
      await client.ping();
    } catch (err: any) {
      if (!finalUrl.startsWith('rediss://')) {
        const sslUrl = finalUrl.replace('redis://', 'rediss://');
        const sslClient = new Redis(sslUrl, { connectTimeout: 15000, tls: { rejectUnauthorized: false } });
        await sslClient.ping();
        client = sslClient;
      } else throw err;
    }
    redisClients.set(url, client!);
  }
  return client!;
}
