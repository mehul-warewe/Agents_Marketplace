import { createClient } from '@repo/database';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is required');
}

export const db = createClient(process.env.POSTGRES_URL);
