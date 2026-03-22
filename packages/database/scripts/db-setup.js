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
    const migrationsDir = path.resolve(__dirname, '../drizzle');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files. Initializing database...`);

    for (const file of files) {
      console.log(`- Running ${file}...`);
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Drizzle-kit split commands by --> statement-breakpoint
      const statements = content.split('--> statement-breakpoint');
      
      for (const statement of statements) {
        if (statement.trim()) {
          await sql.unsafe(statement);
        }
      }
    }

    console.log('✅ Local database initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
