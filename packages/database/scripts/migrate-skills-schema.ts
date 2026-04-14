import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const sql = postgres(process.env.POSTGRES_URL!);

async function migrate() {
  console.log('Running skills schema migration...');
  
  // Add input_schema column (safe - IF NOT EXISTS)
  await sql`
    ALTER TABLE skills 
    ADD COLUMN IF NOT EXISTS input_schema jsonb DEFAULT '[]'::jsonb
  `;
  console.log('✅ input_schema column added');

  // Add output_description column (safe - IF NOT EXISTS)
  await sql`
    ALTER TABLE skills 
    ADD COLUMN IF NOT EXISTS output_description text
  `;
  console.log('✅ output_description column added');

  await sql.end();
  console.log('Migration complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
