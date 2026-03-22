import { Queue } from 'bullmq';
import { Redis, type RedisOptions } from 'ioredis';

export const AGENT_EXECUTION_QUEUE = 'agent-execution';

export const getRedisConnection = (options?: RedisOptions): Redis => {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    ...options,
  }) as any; // Cast to any if needed to satisfy BullMQ's expected connection type
};

export const createExecutionQueue = (connection: Redis) => {
  return new Queue(AGENT_EXECUTION_QUEUE, { connection });
};
