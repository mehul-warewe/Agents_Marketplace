import { Queue } from 'bullmq';
import { Redis, type RedisOptions } from 'ioredis';

export const AGENT_EXECUTION_QUEUE = 'agent-execution';

export const getRedisConnection = (options?: RedisOptions): Redis => {
  // Support Railway's REDIS_URL, or individual REDIS_HOST/REDIS_PORT vars
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
  if (redisUrl) {
    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      ...options,
    }) as any;
  }
  return new Redis({
    host: process.env.REDIS_HOST || process.env.REDISHOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379'),
    password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
    maxRetriesPerRequest: null,
    ...options,
  }) as any;
};

export const createExecutionQueue = (connection: Redis) => {
  return new Queue(AGENT_EXECUTION_QUEUE, { connection });
};
