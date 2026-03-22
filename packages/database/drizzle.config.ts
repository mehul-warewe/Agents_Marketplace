import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from the monorepo root
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
