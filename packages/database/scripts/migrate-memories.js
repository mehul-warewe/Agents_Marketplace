
const postgres = require('postgres');
require('dotenv').config({ path: '../../.env' });

async function run() {
  const sql = postgres(process.env.POSTGRES_URL);
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS memories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key text NOT NULL,
        value jsonb NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Memory table created successfully.");
  } catch (err) {
    console.error("Failed to create table:", err);
  } finally {
    await sql.end();
  }
}

run();
