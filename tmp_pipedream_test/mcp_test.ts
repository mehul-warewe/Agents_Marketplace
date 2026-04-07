import * as dotenv from 'dotenv';
import { PipedreamClient } from "@pipedream/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Load .env from root
dotenv.config({ path: '../.env' });

async function run() {
  const clientId = process.env.PIPEDREAM_CLIENT_ID;
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  const projectId = process.env.PIPEDREAM_PROJECT_ID;

  console.log(`[Test] Connecting via Pipedream SDK with Project ID: ${projectId}...`);

  if (!clientId || !clientSecret || !projectId) {
    console.error("Error: Missing Pipedream credentials in .env (search for ../.env)");
    process.exit(1);
  }

  const pdClient = new PipedreamClient({ 
    clientId, 
    clientSecret, 
    projectId 
  });

  try {
    // 1. Get raw access token for MCP server auth
    const accessToken = await pdClient.rawAccessToken;
    console.log("[Test] Successfully retrieved Access Token via SDK.");

    // 2. Setup MCP client with Pipedream remote server
    const serverUrl = "https://remote.mcp.pipedream.net";
    const externalUserId = "test-user-dev";
    const appSlug = "github"; // Test with a popular app

    console.log(`[Test] Connecting to Pipedream MCP server for app: ${appSlug}...`);

    const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
      requestInit: {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "x-pd-project-id": projectId,
          "x-pd-environment": "development",
          "x-pd-external-user-id": externalUserId,
          "x-pd-app-slug": appSlug
        }
      }
    });

    const mcpClient = new Client({
      name: "AntigravityTestClient",
      version: "1.0.0"
    }, {
      capabilities: {}
    });

    await mcpClient.connect(transport);
    console.log("[Test] Connected to Pipedream MCP successfully!");

    // 3. List tools provided by the app
    const toolsResult = await mcpClient.listTools();
    console.log(`\n--- Tools available for ${appSlug} (${toolsResult.tools.length} found) ---`);
    toolsResult.tools.slice(0, 10).forEach((t: any) => {
      console.log(`- ${t.name}: ${t.description?.split('\n')[0].substring(0, 80) || 'No description'}...`);
    });

    console.log("\n[Test] Pipedream Connect working as expected.");
    process.exit(0);

  } catch (err: any) {
    console.error("\n[Test Failure]", err.message);
    if (err.body) {
      console.error("Details:", JSON.stringify(err.body, null, 2));
    }
    process.exit(1);
  }
}

run();
