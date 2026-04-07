import * as dotenv from 'dotenv';
import { PipedreamClient } from "@pipedream/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Load .env
dotenv.config({ path: '../.env' });

async function runBridgeTest() {
  const { PIPEDREAM_CLIENT_ID: clientId, PIPEDREAM_CLIENT_SECRET: clientSecret, PIPEDREAM_PROJECT_ID: projectId } = process.env;

  if (!clientId || !clientSecret || !projectId) {
    console.error("Missing Pipedream credentials");
    return;
  }

  const pdClient = new PipedreamClient({ clientId, clientSecret, projectId, projectEnvironment: "development" });
  const accessToken = await pdClient.rawAccessToken;

  console.log("--- Pipedream Bridge Integration Test ---\n");

  // 1. Fetching Top 10 Apps (Slugs) for the Sidebar
  console.log("[1] Fetching popular apps for the sidebar...");
  const apps = await pdClient.apps.list({ limit: 10, q: "slack github notion google" });
  const appSlugs: string[] = [];
  for await (const app of apps) {
    console.log(`- ${app.name} (Slug: ${app.id.replace('app_', '')})`);
    appSlugs.push(app.id.replace('app_', '')); // Simplified extraction
  }

  // 2. Discovering Tools for a selected App (e.g., Slack)
  const targetApp = "slack";
  console.log(`\n[2] Connecting to MCP to discover tools for: ${targetApp}...`);

  const transport = new StreamableHTTPClientTransport(new URL("https://remote.mcp.pipedream.net"), {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-pd-project-id": projectId,
        "x-pd-environment": "development",
        "x-pd-external-user-id": "test-user-001",
        "x-pd-app-slug": targetApp
      }
    }
  });

  const mcpClient = new Client({ name: "BridgeTester", version: "1.0.0" }, { capabilities: {} });
  await mcpClient.connect(transport);

  const tools = await mcpClient.listTools();
  console.log(`Found ${tools.tools.length} executable actions for ${targetApp}.`);

  // 3. Execution Simulation
  console.log("\n[3] Execution Blueprint:");
  const exampleTool = tools.tools[0];
  console.log(`Selected Tool: ${exampleTool.name}`);
  console.log(`Input Schema: ${JSON.stringify(exampleTool.inputSchema).substring(0, 100)}...`);

  console.log("\nCONCLUSION: To execute, we just call mcpClient.callTool(name, args).");
  console.log("This replaces all manual handler.ts files with a single generic runner.");
}

runBridgeTest().catch(console.error);
