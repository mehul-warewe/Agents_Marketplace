import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { log } from '../../shared/logger.js';

export const pipedreamMcpService = {
  async listToolsForApp(appSlug: string, externalUserId: string, accessToken: string) {
    const projectId = process.env.PIPEDREAM_PROJECT_ID;
    const cleanSlug = appSlug.startsWith('app_') ? appSlug.replace('app_', '') : appSlug;
    const mcpUrl = `https://remote.mcp.pipedream.net/${externalUserId}/${cleanSlug}`;

    const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
      requestInit: {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-pd-project-id': projectId!,
        },
      },
    });

    const client = new MCPClient({ name: 'warewe-api', version: '1.0.0' }, { capabilities: {} });
    
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      return tools.tools || [];
    } catch (err) {
      log.error(`[pipedream-mcp] Failed to list tools for ${appSlug}:`, err);
      throw err;
    }
  }
};
