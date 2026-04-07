import * as dotenv from 'dotenv';
import { PipedreamClient } from "@pipedream/sdk";

// Load .env
dotenv.config();

async function run() {
  const clientId = process.env.PIPEDREAM_CLIENT_ID;
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  const projectId = process.env.PIPEDREAM_PROJECT_ID;

  console.log(`[Pipedream] Starting Explorer with Project ID: ${projectId}...`);

  if (!clientId || !clientSecret || !projectId) {
    console.error("Error: Missing Pipedream credentials in .env");
    process.exit(1);
  }

  // Explicitly set to 'development' to avoid plan restrictions on 'production'
  const client = new PipedreamClient({ 
    clientId, 
    clientSecret, 
    projectId,
    projectEnvironment: "development"
  });

  try {
    // 1. Fetch available apps (integrations)
    console.log("\n--- Testing: Fetching Available Apps (Limit 5) ---");
    const apps = await client.apps.list({ limit: 5 });
    let appCount = 0;
    for await (const app of apps) {
      console.log(`[App] ${app.name} - ID: ${app.id}`);
      appCount++;
      if (appCount >= 5) break;
    }
    
    if (appCount === 0) {
      console.log("No apps found or unauthorized.");
    }

    // 2. Fetch recent actions
    console.log("\n--- Testing: Fetching Available Actions (Limit 5) ---");
    try {
      const actions = await client.actions.list({ limit: 5 });
      let actionCount = 0;
      for await (const action of actions) {
        console.log(`[Action] ${action.name} (${action.appName}) - ID: ${action.id}`);
        actionCount++;
        if (actionCount >= 5) break;
      }

      if (actionCount === 0) {
        console.log("No actions found (this is normal for new projects).");
      }
    } catch (actionErr: any) {
      console.error("[Action Sync Error]", actionErr.message);
      if (actionErr.body) console.error("Body:", actionErr.body);
    }

    console.log("\n[Pipedream] Explorer completed successfully.");
  } catch (err: any) {
    console.error("\n[Pipedream Error]", err.message);
    if (err.body) {
      console.error("Details:", JSON.stringify(err.body, null, 2));
    }
    process.exit(1);
  }
}

run();
