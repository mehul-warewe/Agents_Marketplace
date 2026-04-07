import * as dotenv from 'dotenv';
import { PipedreamClient } from "@pipedream/sdk";

// Load .env
dotenv.config({ path: '../.env' });

async function simulateSidebarDiscovery() {
  const { PIPEDREAM_CLIENT_ID: clientId, PIPEDREAM_CLIENT_SECRET: clientSecret, PIPEDREAM_PROJECT_ID: projectId } = process.env;

  const pdClient = new PipedreamClient({ clientId, clientSecret, projectId, projectEnvironment: "development" });

  console.log("--- SIMULATING SIDEBAR DISCOVERY ---");
  console.log("[Goal] Fetch separate platforms to show as individual nodes.\n");

  try {
    // 1. Fetching first 10 popular apps to show in the sidebar
    console.log("Fetching first 10 apps...");
    const appsList = await pdClient.apps.list({ limit: 10 });
    
    const sidebarNodes = [];
    for await (const app of appsList) {
      // Map Pipedream App to our internal Node structure
      sidebarNodes.push({
        id: `pipedream:${app.id.replace('app_', '')}`,
        label: app.name,
        category: "Integrations",
        icon: `https://pipedream.com/s.v0/${app.id}/logo/96`,
        executionKey: "pipedream_action",
        description: `Connect and automate ${app.name} via Pipedream.`
      });
      if (sidebarNodes.length >= 10) break;
    }

    console.log(`Generated ${sidebarNodes.length} individual platform nodes for the sidebar:`);
    sidebarNodes.forEach(node => {
      console.log(`[Node] ID: ${node.id.padEnd(25)} | Label: ${node.label}`);
    });

    console.log("\n[SUCCESS] The sidebar can now dynamically render each platform as a separate node.");

  } catch (err: any) {
    console.error("Discovery Failed:", err.message);
  }
}

simulateSidebarDiscovery();
