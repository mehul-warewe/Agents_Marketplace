/**
 * Pipedream MCP Client Utilities
 * Handles connection, tool discovery, and execution
 */

import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { PipedreamClient } from '@pipedream/sdk';

export interface MCPConnectionConfig {
  accessToken: string;
  projectId: string;
  appSlug: string;
  environment?: string;
  externalUserId: string;
}

export interface PipedreamToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface PipedreamToolResult {
  status: 'completed' | 'failed';
  data?: any;
  error?: string;
  raw?: any;
}

/**
 * Initialize MCP client for Pipedream
 * Handles transport setup and connection
 */
export async function initializeMCPClient(
  config: MCPConnectionConfig
): Promise<MCPClient> {
  try {
    const transport = new StreamableHTTPClientTransport(
      new URL('https://remote.mcp.pipedream.net'),
      {
        requestInit: {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'x-pd-project-id': config.projectId,
            'x-pd-environment': config.environment || 'development',
            'x-pd-app-slug': config.appSlug,
            'x-pd-external-user-id': config.externalUserId,
          }
        }
      }
    );

    const client = new MCPClient(
      { name: 'WareweWorker', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    return client;
  } catch (err: any) {
    throw new Error(`Failed to initialize MCP client: ${err.message}`);
  }
}

/**
 * Call a Pipedream tool via MCP
 */
export async function callPipedreamTool(
  client: MCPClient,
  toolCall: PipedreamToolCall
): Promise<any> {
  try {
    const result = await client.callTool({
      name: toolCall.name,
      arguments: toolCall.arguments
    });

    return result;
  } catch (err: any) {
    throw new Error(`Tool execution failed: ${err.message}`);
  }
}

/**
 * Extract clean response from MCP result
 * Handles different content types (text, error, etc.)
 */
export function extractMCPResponse(result: any): PipedreamToolResult {
  try {
    if (!result || !result.content) {
      return {
        status: 'completed',
        data: result,
        raw: result
      };
    }

    const content = result.content;

    // Handle array of content blocks
    if (Array.isArray(content)) {
      const textBlock = content.find(c => c.type === 'text');
      const errorBlock = content.find(c => c.type === 'error');

      if (errorBlock) {
        return {
          status: 'failed',
          error: errorBlock.text || 'Unknown error from Pipedream',
          raw: content
        };
      }

      // Try to parse as JSON if text looks like JSON
      if (textBlock?.text) {
        try {
          const parsed = JSON.parse(textBlock.text);
          return {
            status: 'completed',
            data: parsed,
            raw: content
          };
        } catch {
          // Not JSON, return as text
          return {
            status: 'completed',
            data: { text: textBlock.text },
            raw: content
          };
        }
      }

      // Return all content blocks as data
      return {
        status: 'completed',
        data: content,
        raw: content
      };
    }

    // Single content object
    if (typeof content === 'object') {
      if (content.type === 'error') {
        return {
          status: 'failed',
          error: content.text || 'Unknown error',
          raw: content
        };
      }

      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          return {
            status: 'completed',
            data: parsed,
            raw: content
          };
        } catch {
          return {
            status: 'completed',
            data: { text: content.text },
            raw: content
          };
        }
      }

      return {
        status: 'completed',
        data: content,
        raw: content
      };
    }

    // Plain text or other type
    return {
      status: 'completed',
      data: content,
      raw: content
    };
  } catch (err: any) {
    return {
      status: 'failed',
      error: `Failed to extract response: ${err.message}`,
      raw: result
    };
  }
}

/**
 * Get Pipedream client instance
 */
export function getPipedreamClient(): PipedreamClient | null {
  const { PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, PIPEDREAM_PROJECT_ID } = process.env;

  if (!PIPEDREAM_CLIENT_ID || !PIPEDREAM_CLIENT_SECRET || !PIPEDREAM_PROJECT_ID) {
    console.error('[Pipedream] Missing required environment variables');
    return null;
  }

  return new PipedreamClient({
    clientId: PIPEDREAM_CLIENT_ID,
    clientSecret: PIPEDREAM_CLIENT_SECRET,
    projectId: PIPEDREAM_PROJECT_ID,
    projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT as any) || 'development'
  });
}
