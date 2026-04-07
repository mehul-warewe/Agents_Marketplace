import * as dotenv from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

async function init() {
  const sql = postgres(process.env.POSTGRES_URL!);
  
  console.log('🏗 Setting up pipedream_apps table…');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pipedream_apps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT,
        description TEXT,
        last_synced_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✅ Table ready.');
  } catch (err: any) {
    console.error('❌ Failed to create table:', err.message);
  } finally {
    process.exit(0);
  }
}

init();
