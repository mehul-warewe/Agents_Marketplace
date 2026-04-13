import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL not found in .env');
  process.exit(1);
}

const sql = postgres(connectionString);

async function run() {
  try {
    const migrationFile = path.resolve(__dirname, '../drizzle/0006_skills_employees.sql');
    console.log(`Running migration: ${migrationFile}`);
    
    const content = fs.readFileSync(migrationFile, 'utf8');
    const statements = content.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing statement...`);
        await sql.unsafe(statement);
      }
    }

    console.log('✅ Migration run successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
