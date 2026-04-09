import { PipedreamClient } from '@pipedream/sdk/server';
import { log } from '../../shared/logger.js';

/**
 * Fetches available actions (components) for a Pipedream app.
 * Uses the official Pipedream SDK: client.components.list({ app: slug })
 * which powers the same component discovery as Relevance AI and other platforms.
 */
export const pipedreamMcpService = {
  async listToolsForApp(appSlug: string, externalUserId: string, accessToken: string): Promise<any[]> {
    // Skip clearly invalid slugs immediately
    if (!appSlug || appSlug === '__integrations_view__') {
      return [];
    }

    const cleanSlug = appSlug.startsWith('app_') ? appSlug.replace('app_', '') : appSlug;

    try {
      log.info(`[pipedream-mcp] Fetching components for app: ${cleanSlug}`);

      // Use the official Pipedream SDK for component discovery
      const pd = new PipedreamClient({
        projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT || 'development') as 'development' | 'production',
        clientId: process.env.PIPEDREAM_CLIENT_ID!,
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
        projectId: process.env.PIPEDREAM_PROJECT_ID!,
      });

      /**
       * Phase 1: Exact app filter — fast and precise for most apps.
       * Phase 2: Text search fallback — catches slugs that differ between
       *          the apps API (name_slug) and the component registry key,
       *          e.g. "youtube" (name_slug) vs "youtube_data_api" (component key).
       */
      const fetchComponents = async (params: Record<string, any>): Promise<any[]> => {
        let all: any[] = [];
        let cursor: string | undefined;
        while (true) {
          const res: any = await pd.components.list({
            componentType: 'action',
            limit: 100,
            ...(cursor ? { after: cursor } : {}),
            ...params,
          });
          const data: any[] = res?.data || [];
          all = [...all, ...data];
          const pageInfo = res?.page_info;
          if (!pageInfo?.end_cursor || data.length < 100) break;
          cursor = pageInfo.end_cursor;
        }
        return all;
      };

      // Phase 1: exact app slug filter
      let allComponents = await fetchComponents({ app: cleanSlug });

      // Phase 2: text search fallback if exact match returned nothing
      if (allComponents.length === 0) {
        log.info(`[pipedream-mcp] No results for app:"${cleanSlug}", retrying with q: search...`);
        allComponents = await fetchComponents({ q: cleanSlug });
      }

      log.info(`[pipedream-mcp] Found ${allComponents.length} actions for ${cleanSlug}`);

      // Normalize to our tool shape
      const tools = allComponents.map((c: any) => ({
        name: c.name || c.key,
        description: c.description || '',
        key: c.key,
        version: c.version,
        inputSchema: {
          type: 'object',
          properties: Object.fromEntries(
            (c.configurableProps || [])
              .filter((prop: any) => prop.type !== 'app' && !prop.type?.startsWith('$.'))
              .map((prop: any) => [
                prop.name,
                {
                  type: prop.type === 'string' || prop.type === 'integer' || prop.type === 'boolean'
                    ? prop.type
                    : 'string', // fallback for string[], object, remote options, etc.
                  description: prop.label || prop.description || prop.name,
                },
              ])
          ),
          required: (c.configurableProps || [])
            .filter((prop: any) => prop.type !== 'app' && !prop.type?.startsWith('$.'))
            .filter((p: any) => !p.optional)
            .map((p: any) => p.name),
        },
      }));

      // Injected Fallback: Universal API Request Block (Mimics Relevance AI)
      // This is added to EVERY platform. If a platform has 0 native actions (like 1msg),
      // it will now show exactly 1 action: the API Request block.
      tools.push({
        name: `Custom API Call`,
        description: `Make an authorized custom request to the ${cleanSlug} API using your connected account.`,
        key: `__custom_api_call`, // special internal key
        version: '1.0.0',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: 'Method (e.g. GET, POST, PUT, DELETE)',
              enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            },
            path: {
              type: 'string',
              description: "Relative path (e.g. /v1/users)"
            },
            body: {
              type: 'string',
              description: 'Body (JSON string, Optional)'
            },
            headers: {
              type: 'string',
              description: 'Headers (JSON string, Optional)'
            }
          },
          required: ['method', 'path']
        }
      });

      return tools;
    } catch (err: any) {
      log.error(`[pipedream-mcp] Error fetching components for ${cleanSlug}:`, err.message);
      return [];
    }
  },
};
