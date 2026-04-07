import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { PipedreamClient } from '@pipedream/sdk';
import { createClient, pipedreamApps, sql } from '@repo/database';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

const db = createClient(process.env.POSTGRES_URL!);

async function sync() {
  const { PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, PIPEDREAM_PROJECT_ID } = process.env;
  if (!PIPEDREAM_CLIENT_ID || !PIPEDREAM_CLIENT_SECRET || !PIPEDREAM_PROJECT_ID) {
    console.error('Pipedream env vars missing!');
    process.exit(1);
  }

  const pd = new PipedreamClient({
    clientId: PIPEDREAM_CLIENT_ID,
    clientSecret: PIPEDREAM_CLIENT_SECRET,
    projectId: PIPEDREAM_PROJECT_ID,
    projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT as any) || 'development',
  });

  console.log('🔄 RESILIENT SYNC: Continuing Pipedream App Sync…');

  let count = 0;
  let cursor: string | undefined = undefined;
  
  try {
    while (true) {
      try {
        const response = await (pd as any).apps.list({ limit: 100, cursor });
        
        let items = [];
        if (Array.isArray(response)) {
          items = response;
          cursor = (response as any).next_page_cursor; // Try to extract from metadata if present
        } else if (response.apps) {
          items = response.apps;
          cursor = response.next_page_cursor;
        } else {
          // If response is iterator, we can't easily skip to cursor without iterating
          let skip = 0;
          for await (const app of response) {
             if (skip < count) { skip++; continue; }
             items.push(app);
             if (items.length >= 100) break;
          }
        }

        if (items.length === 0) break;

        for (const app of items) {
          count++;
          const payload = {
            id: app.id,
            name: app.name,
            slug: app.slug || app.id.replace('app_', ''), // PRIORITIZE SLUG
            icon: app.icon || `https://pipedream.com/s.v0/${app.id}/logo/96`,
            description: `Powered by Pipedream Connect`,
            lastSyncedAt: new Date(),
          };

          await db.insert(pipedreamApps)
            .values(payload)
            .onConflictDoUpdate({
               target: pipedreamApps.id,
               set: {
                 name: payload.name,
                 slug: payload.slug,
                 icon: payload.icon,
                 lastSyncedAt: payload.lastSyncedAt
               }
            });
        }

        console.log(`  - Currently synced: ${count} apps…`);
        if (items.length < 100 && !cursor) break;

        // Long delay to avoid Pipedream 429
        await new Promise(r => setTimeout(r, 500));
      } catch (err: any) {
        if (err.response?.status === 429) {
           console.log('⚠️ Rate limited! Sleeping for 5s…');
           await new Promise(r => setTimeout(r, 5000));
           continue; // Retry same cursor
        }
        throw err;
      }
    }

    console.log(`✅ COMPLETED: Fully synced ${count} Pipedream platforms.`);
  } catch (err: any) {
    console.error('❌ Sync CRASHED:', err.message);
  } finally {
    process.exit(0);
  }
}

sync();
