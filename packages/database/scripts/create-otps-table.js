import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('POSTGRES_URL not found');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "otps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "code" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('✅ Table "otps" created successfully!');
  } catch (err) {
    console.error('❌ Error creating table:', err);
  } finally {
    await sql.end();
  }
}

run();
