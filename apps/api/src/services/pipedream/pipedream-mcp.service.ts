import { PipedreamClient } from '@pipedream/sdk/server';
import { log } from '../../shared/logger.js';

/**
 * Fetches available actions (components) for a Pipedream app.
 * Uses the official Pipedream SDK: client.components.list({ app: slug })
 * which powers the same component discovery as Relevance AI and other platforms.
 */
export const pipedreamMcpService = {
  async fetchComponents(pd: PipedreamClient, type: 'action' | 'trigger', params: Record<string, any>): Promise<any[]> {
    let all: any[] = [];
    let cursor: string | undefined;
    while (true) {
      const res: any = await pd.components.list({
        componentType: type,
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
  },

  async listToolsForApp(appSlug: string, externalUserId: string, accessToken: string): Promise<any[]> {
    if (!appSlug || appSlug === '__integrations_view__') return [];
    const cleanSlug = appSlug.startsWith('app_') ? appSlug.replace('app_', '') : appSlug;
    const REDIS_TOOLS_KEY = `pipedream:tools:v1:granular:${cleanSlug}`;

    try {
      // 1. Check Redis Cache
      const redis = (await import('@repo/queue')).getRedisConnection();
      const cached = await redis.get(REDIS_TOOLS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      const pd = new PipedreamClient({
        projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT || 'development') as 'development' | 'production',
        clientId: process.env.PIPEDREAM_CLIENT_ID!,
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
        projectId: process.env.PIPEDREAM_PROJECT_ID!,
      });

      // We use the Component API here to get FULL granular control (Summary, Start Time, etc.)
      let allComponents = await this.fetchComponents(pd, 'action', { app: cleanSlug });
      if (allComponents.length === 0) allComponents = await this.fetchComponents(pd, 'action', { q: cleanSlug });

      const tools = allComponents.map((c: any) => ({
        name: c.name || c.key,
        description: c.description || '',
        key: c.key,
        version: c.version,
        inputSchema: this.mapConfigurableProps(c.configurableProps),
      }));

      // Injected Fallback: Custom API Call
      tools.push({
        name: `Custom API Call`,
        description: `Make an authorized custom request to the ${cleanSlug} API.`,
        key: `__custom_api_call`,
        inputSchema: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
            path: { type: 'string', description: 'API path (e.g. /me)' },
            body: { type: 'string', description: 'JSON body string' },
            headers: { type: 'string', description: 'JSON headers string' }
          },
          required: ['method', 'path']
        }
      });

      // 2. Save to Redis (Cache for 24 hours)
      if (tools.length > 0) {
        await redis.setex(REDIS_TOOLS_KEY, 60 * 60 * 24, JSON.stringify(tools));
      }
      return tools;
    } catch (err: any) {
      log.error(`[pipedream-mcp] Error fetching actions: ${err.message}`);
      return [];
    }
  },

  async listTriggersForApp(appSlug: string, externalUserId: string, accessToken: string): Promise<any[]> {
    if (!appSlug || appSlug === '__integrations_view__') return [];
    const cleanSlug = appSlug.startsWith('app_') ? appSlug.replace('app_', '') : appSlug;

    try {
      const pd = new PipedreamClient({
        projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT || 'development') as 'development' | 'production',
        clientId: process.env.PIPEDREAM_CLIENT_ID!,
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
        projectId: process.env.PIPEDREAM_PROJECT_ID!,
      });

      let allComponents = await this.fetchComponents(pd, 'trigger', { app: cleanSlug });
      if (allComponents.length === 0) allComponents = await this.fetchComponents(pd, 'trigger', { q: cleanSlug });

      return allComponents.map((c: any) => ({
        name: c.name || c.key,
        description: c.description || '',
        key: c.key,
        version: c.version,
        inputSchema: this.mapConfigurableProps(c.configurableProps),
      }));
    } catch (err: any) {
      log.error(`[pipedream-mcp] Error fetching triggers: ${err.message}`);
      return [];
    }
  },

  mapConfigurableProps(props: any[] = []) {
    return {
      type: 'object',
      properties: Object.fromEntries(
        (props || [])
          .filter((prop: any) => prop.type !== 'app' && !prop.type?.startsWith('$.'))
          .map((prop: any) => {
            const schema: any = {
              type: prop.type === 'string' || prop.type === 'integer' || prop.type === 'boolean' || prop.type === 'number' ? prop.type : 'string',
              title: prop.label || prop.name,
              description: prop.description || '',
            };

            if (prop.default !== undefined) {
              schema.default = prop.default;
            }

            // Handle enums/options
            if (Array.isArray(prop.options)) {
              schema.enum = prop.options.map((opt: any) => 
                typeof opt === 'object' ? (opt.value ?? opt.label) : opt
              );
            }

            return [prop.name, schema];
          })
      ),
      required: (props || [])
        .filter((prop: any) => prop.type !== 'app' && !prop.type?.startsWith('$.'))
        .filter((p: any) => !p.optional)
        .map((p: any) => p.name),
    };
  }
};
