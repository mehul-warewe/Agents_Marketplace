import * as dotenv from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

async function check() {
  const sql = postgres(process.env.POSTGRES_URL!);
  
  try {
    const letters = ['A', 'B', 'M', 'Z'];
    console.log(`📊 Pipedream Cache Summary (n=3,175):`);
    for (const L of letters) {
       const res = await sql`SELECT name FROM pipedream_apps WHERE name ILIKE ${L+'%'} LIMIT 3;`;
       console.log(`  - Apps starting with ${L}: ${res.map(s => s.name).join(', ') || '(none)'}`);
    }
  } catch (err: any) {
    console.error('❌ Check failed:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
