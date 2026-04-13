import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const clientId = process.env.PIPEDREAM_CLIENT_ID;
const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
const projectId = process.env.PIPEDREAM_PROJECT_ID;

if (!clientId || !clientSecret) {
  console.error('Error: PIPEDREAM_CLIENT_ID or PIPEDREAM_CLIENT_SECRET not found in .env');
  process.exit(1);
}
const externalUserId = 'c388602c-fbc0-4ba0-a4cc-20e3dcff3a47'; // From logs
const targetAppSlug = 'app_13Gh2V'; // Google Calendar ID

async function test() {
  console.log('--- Pipedream Account Discovery Test ---');
  
  // 1. Get Token
  console.log('Fetching OAuth Token...');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await axios.post(
    'https://api.pipedream.com/v1/oauth/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const token = tokenRes.data.access_token;
  console.log('Token acquired.');

  // 2. Fetch All Accounts (No Filter)
  console.log('\nFetching ALL accounts for user...');
  const allRes = await axios.get(`https://api.pipedream.com/v1/connect/${projectId}/accounts?external_user_id=${externalUserId}`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'x-pd-environment': 'development'
    }
  });
  
  const allAccounts = allRes.data?.data || [];
  console.log(`Received ${allAccounts.length} accounts total.`);
  
  allAccounts.forEach((acc: any, i: number) => {
    console.log(`\nAccount ${i + 1}:`);
    console.log(JSON.stringify(acc, null, 2));
    console.log(`- [${acc.app?.name}] Slug: ${acc.app?.slug}, ID: ${acc.app?.id}, Name: ${acc.name || 'Unnamed'}`);
  });

  // 3. Test Filtering Logic
  console.log(`\nTesting filter for: ${targetAppSlug}`);
  const filtered = allAccounts.filter((acc: any) => {
    const slugMatch = acc.app?.slug === 'google_calendar' || acc.app?.slug === 'google-calendar';
    const idMatch = acc.app?.id === targetAppSlug;
    return slugMatch || idMatch;
  });

  console.log(`Filter results (${filtered.length} found):`);
  filtered.forEach((acc: any) => {
    console.log(`  MATCH: ${acc.app?.name} (${acc.id})`);
  });

  if (filtered.length === 0) {
    console.log('\n!!! WARNING: Filter returned ZERO results.');
    console.log('This confirms our filtering logic is too strict for the data Pipedream is returning.');
  } else {
    console.log('\nSuccess: Filter found the correct accounts.');
  }
}

test().catch(console.error);
