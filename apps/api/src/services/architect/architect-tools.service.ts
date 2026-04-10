import { DynamicTool } from '@langchain/core/tools';
import { NODE_REGISTRY } from '@repo/nodes';
import { pipedreamAppsService } from '../pipedream/pipedream-apps.service.js';
import { pipedreamService } from '../pipedream/pipedream.service.js';
import { pipedreamMcpService } from '../pipedream/pipedream-mcp.service.js';
import { log } from '../../shared/logger.js';

/**
 * Tool 1: Marketplace Search (Discovery)
 * Purpose: Find platforms (Native or Pipedream)
 */
export const searchMarketplaceTool = new DynamicTool({
  name: 'search_marketplace',
  description: 'Search for any integration platform (e.g., Slack, GitHub, Salesforce, OpenAI). Returns names and IDs (appSlugs).',
  func: async (input: string) => {
    try {
      const q = (input || '').toLowerCase().trim();
      
      // 1. Search Native Nodes
      const nativeMatches = NODE_REGISTRY.filter(n => 
        n.label.toLowerCase().includes(q) || 
        n.category.toLowerCase().includes(q)
      ).map(n => ({
        type: 'native',
        id: n.id,
        name: n.label,
        category: n.category,
        description: n.description
      }));

      // 2. Search Pipedream Marketplace
      const pdResults = await pipedreamAppsService.searchApps(q, 15, 0);
      const pdMatches = pdResults.results.map((r: any) => ({
        type: 'pipedream',
        appSlug: r.slug,
        name: r.name,
        description: 'Global integration via Pipedream.'
      }));

      return JSON.stringify({ native: nativeMatches, pipedream: pdMatches });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  }
});

/**
 * Tool 2: Get Action Details (Inspection)
 * Purpose: Fetch exactly what fields a node needs.
 */
export const getActionDetailsTool = new DynamicTool({
  name: 'get_action_details',
  description: 'Fetches the technical inputs and schema for a specific action on a platform. Input: { type: "native"|"pipedream", idOrSlug: string }',
  func: async (input: string) => {
    try {
      const { type, idOrSlug } = JSON.parse(input);

      if (type === 'native') {
        const node = NODE_REGISTRY.find(n => n.id === idOrSlug || n.label.toLowerCase() === idOrSlug.toLowerCase());
        if (!node) return JSON.stringify({ error: 'Node not found' });
        
        const operations = node.operationInputs ? Object.keys(node.operationInputs).map(op => ({
          name: op,
          inputs: node.operationInputs![op],
          outputs: node.operationOutputs?.[op] || []
        })) : null;

        return JSON.stringify({
          name: node.label,
          description: node.description,
          configFields: node.configFields,
          operations
        });
      }

      if (type === 'pipedream') {
        const token = await pipedreamService.getOAuthToken();
        const tools = await pipedreamMcpService.listToolsForApp(idOrSlug, 'architect', token);
        return JSON.stringify(tools.map(t => ({
          actionName: t.key || t.name,
          displayName: t.name,
          description: t.description,
          schema: t.inputSchema
        })));
      }

      return JSON.stringify({ error: 'Invalid type' });
    } catch (err: any) {
      return JSON.stringify({ error: `Fetch failed: ${err.message}` });
    }
  }
});

/**
 * Tool 3: Build Final Workflow (Construction)
 * Purpose: Connect all nodes into a final JSON.
 */
export const buildWorkflowTool = new DynamicTool({
  name: 'build_workflow',
  description: 'Constructs the final workflow JSON. Input: { name, description, steps: [{ id, type, idOrSlug, action, config }] }',
  func: async (input: string) => {
    try {
      const { name, description, steps } = JSON.parse(input);
      const builtNodes: any[] = [];
      const nodeCounters: Record<string, number> = {};

      for (const step of steps) {
        const pos = { x: builtNodes.length * 300, y: 150 };
        const { id, type, idOrSlug, action, config } = step;

        if (type === 'native') {
          const nDef = NODE_REGISTRY.find(n => n.id === idOrSlug || n.label.toLowerCase() === idOrSlug.toLowerCase());
          if (!nDef) continue;
          
          builtNodes.push({
            id: id || `${nDef.id.replace('.', '_')}_${(nodeCounters[nDef.id] || 0) + 1}`,
            label: nDef.label,
            data: { label: nDef.label, toolId: nDef.id, config, isTrigger: nDef.isTrigger },
            position: pos
          });
        } else if (type === 'pipedream') {
          const slug = idOrSlug.toLowerCase().replace(/\s+/g, '');
          builtNodes.push({
            id: id || `pd_${slug}_${(nodeCounters[slug] || 0) + 1}`,
            label: idOrSlug,
            data: { 
              label: idOrSlug, 
              toolId: 'pipedream.action', 
              config: { appSlug: idOrSlug, actionName: action, ...config } 
            },
            position: pos
          });
        }
        
        const key = idOrSlug || type;
        nodeCounters[key] = (nodeCounters[key] || 0) + 1;
      }

      // Automatically wire nodes sequentially (Linear Wiring)
      const builtEdges = builtNodes.slice(0, -1).map((node, i) => ({
        id: `e-${i}`, 
        source: node.id, 
        target: builtNodes[i + 1].id, 
        sourceHandle: 'output', 
        targetHandle: 'input'
      }));

      return JSON.stringify({ name, description, nodes: builtNodes, edges: builtEdges });
    } catch (err: any) {
      return JSON.stringify({ error: `Build failed: ${err.message}` });
    }
  }
});

export const allArchitectTools = [
  searchMarketplaceTool,
  getActionDetailsTool,
  buildWorkflowTool,
];
