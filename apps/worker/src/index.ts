import './loadenv.js';

import { Worker } from 'bullmq';
import { getRedisConnection, AGENT_EXECUTION_QUEUE } from '@repo/queue';
import { executeRun } from './services/run.service.js';

console.log('Worker service active. Ready for autonomous operations.');

const redis = getRedisConnection();

const worker = new Worker(AGENT_EXECUTION_QUEUE, async (job) => {
  try {
    await executeRun(job);
  } catch (err: any) {
    console.error(`[Worker] Job ${job.id} fatal error:`, err.message);
    throw err;
  }
}, { 
  connection: redis,
  concurrency: 3 
});

worker.on('completed', (job) => console.log(`✅ [Worker] Job ${job?.id} completed`));
worker.on('failed', (job, err) => console.log(`❌ [Worker] Job ${job?.id} failed: ${err?.message}`));
