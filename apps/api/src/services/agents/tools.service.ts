import { tools } from '@repo/database';
import { db } from '../../shared/db.js';
import { NODE_REGISTRY } from '@repo/nodes';
import { log } from '../../shared/logger.js';

const nativeTools = NODE_REGISTRY
    .filter(n => !n.isDecorative)
    .map(n => ({
        name: n.label,
        description: n.description,
        toolId: n.id,
        executionKey: n.executionKey
    }));

export const toolsService = {
  async syncToolRegistry() {
    const existing = await db.select().from(tools);
    const existingIds = existing.map(t => (t as any).toolId);
    const nativeIds = nativeTools.map(t => t.toolId);

    const shouldReset = existing.length !== nativeTools.length || 
                      nativeIds.some(id => !existingIds.includes(id));

    if (shouldReset) {
        log.info('Resyncing tool library from registry...');
        await db.delete(tools);
        for (const tool of nativeTools) {
            await db.insert(tools).values({ 
                name: tool.name, 
                description: tool.description, 
                inputSchema: {} 
            });
        }
    }
  },

  async listAvailableTools() {
    await this.syncToolRegistry();
    return await db.select().from(tools);
  }
};
