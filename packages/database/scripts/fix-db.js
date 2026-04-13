import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const sql = postgres(process.env.POSTGRES_URL);

async function run() {
  try {
    console.log('Running manual database fix...');

    // 1. Add knowledge_ids to employees
    console.log('- Adding knowledge_ids to employees table...');
    await sql.unsafe('ALTER TABLE employees ADD COLUMN IF NOT EXISTS knowledge_ids jsonb DEFAULT \'[]\'::jsonb;');

    // 2. Fix Managers table (worker_ids -> employee_ids)
    console.log('- Renaming worker_ids to employee_ids in managers table...');
    // Check if employee_ids already exists
    const hasEmployeeIds = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'managers' AND column_name = 'employee_ids';
    `;

    if (hasEmployeeIds.length === 0) {
      const hasWorkerIds = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'managers' AND column_name = 'worker_ids';
      `;
      
      if (hasWorkerIds.length > 0) {
        await sql.unsafe('ALTER TABLE managers RENAME COLUMN worker_ids TO employee_ids;');
      } else {
        await sql.unsafe('ALTER TABLE managers ADD COLUMN employee_ids jsonb DEFAULT \'[]\'::jsonb;');
      }
    }

    // 3. Create knowledge table
    console.log('- Creating knowledge table...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS knowledge (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        content text NOT NULL,
        metadata jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    console.log('✅ Manual database fix completed successfully!');
  } catch (err) {
    console.error('❌ Database fix failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
