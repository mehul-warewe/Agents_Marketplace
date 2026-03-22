import { ToolHandler } from '../../tools/types.js';
import { getConnectedMongoClient, getConnectedRedisClient } from '../../tools/data.js';
import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';

/**
 * Recalls recent conversation history from the current workflow context.
 * Useful for providing 'Window Memory' to the Agent.
 */
export const memory_buffer: ToolHandler = async ({ config, ctx }) => {
  const windowSize = parseInt(config.windowSize || '10', 10);
  
  const history = Object.entries(ctx.nodes || {})
    .reverse() 
    .slice(0, windowSize)
    .map(([label, res]: [string, any]) => {
      const msg = res.message || res.output || res.text || (typeof res === 'string' ? res : '');
      return msg ? `${label}: ${msg}` : null;
    })
    .filter(Boolean)
    .join('\n');

  return { 
    memory: history,
    count: history.split('\n').length,
    status: 'recalled'
  };
};

/**
 * MongoDB-backed persistent memory.
 */
export const memory_mongodb: ToolHandler = async ({ config, credentials, userId }) => {
  const { connectionString, database } = credentials || {};
  const { collection = 'memories' } = config;

  if (!connectionString) throw new Error('MongoDB Connection required for memory.');
  const client = await getConnectedMongoClient(connectionString);

  const db = client.db(database);
  const coll = db.collection(collection);

  // Default: Get last 10 messages for this user
  const records = await coll.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const memory = records.map(r => r.content || r.message).reverse().join('\n');

  return { 
    memory: memory || '[No recent MongoDB records found for this user]',
    status: 'connected',
    provider: 'mongodb'
  };
};

/**
 * Redis-backed ephemeral memory.
 */
export const memory_redis: ToolHandler = async ({ config, credentials, userId }) => {
  const { url } = credentials || {};
  if (!url) throw new Error('Redis URL required for memory.');
  const client = await getConnectedRedisClient(url);

  const key = `history:${userId}`;
  const memory = await client.get(key);

  return { 
    memory: memory || '[No cached Redis history found for this user]',
    status: 'connected',
    provider: 'redis'
  };
};
