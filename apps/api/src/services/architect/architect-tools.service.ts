import { DynamicTool } from '@langchain/core/tools';
import { NODE_REGISTRY } from '@repo/nodes';
import { pipedreamAppsService } from '../pipedream/pipedream-apps.service.js';
import { pipedreamService } from '../pipedream/pipedream.service.js';
import { pipedreamMcpService } from '../pipedream/pipedream-mcp.service.js';
import { log } from '../../shared/logger.js';

/**
 * Tool 0: Get Architect Context (Discovery)
 */
export const getArchitectContextTool = new DynamicTool({
  name: 'get_architect_context',
  description: 'Returns available triggers, platform tools, AI nodes, and logic nodes. Use once at the start to find what you need. Input: filter string (optional).',
  func: async (input: string) => {
    try {
      const filter = (input || '').toLowerCase().trim();
      
      const triggers = NODE_REGISTRY.filter(n => n.isTrigger).map(n => ({
        id: n.id,
        label: n.label,
        description: n.description,
        type: n.id.split('.')[1] || 'manual'
      }));

      const platforms: any[] = [];
      const core: any[] = [];

      for (const node of NODE_REGISTRY) {
        if (node.isTrigger) continue;
        if (filter && !node.label.toLowerCase().includes(filter) && !node.category.toLowerCase().includes(filter)) continue;

        const data: any = {
          label: node.label,
          category: node.category,
          description: node.description,
          credentialTypes: node.credentialTypes,
        };

        if (node.operationInputs) {
          data.operations = Object.keys(node.operationInputs).map(op => ({
            name: op,
            description: (node.operationOutputs?.[op]?.[0]?.description) || `Operation: ${op}`
          }));
          platforms.push(data);
        } else {
          data.configFields = node.configFields.filter(f => f.type !== 'notice').map(f => ({
            key: f.key, label: f.label, type: f.type, required: (f as any).required || false, default: f.default
          }));
          data.inputs = node.inputs;
          data.outputs = node.outputs;
          core.push(data);
        }
      }

      return JSON.stringify({ triggers, platforms: platforms.slice(0, 50), coreNodes: core });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  }
});

/**
 * Tool 0.1: Search Pipedream Apps
 */
export const searchPipedreamAppsTool = new DynamicTool({
  name: 'search_pipedream_apps',
  description: 'Search for any platform integration (e.g. Salesforce, Discord, QuickBooks). Returns appSlug and name.',
  func: async (input: string) => {
    try {
      const q = (input || '').toLowerCase().trim();
      // Use the live in-memory cache — no DB required
      const results = await pipedreamAppsService.searchApps(q, 20, 0);

      return JSON.stringify(results.results.map((r: any) => ({
        appSlug: r.slug,
        name: r.name,
        description: 'Pipedream Integration (Dynamic). Use get_pipedream_app_tools with this appSlug to see available actions.'
      })));
    } catch (err) {
       return JSON.stringify({ error: String(err) });
    }
  }
});

/**
 * Tool 0.2: Get Pipedream App Tools (Discovery)
 */
export const getPipedreamAppToolsTool = new DynamicTool({
  name: 'get_pipedream_app_tools',
  description: 'List all available actions (tools) for a specific Pipedream integration. Input: appSlug string.',
  func: async (input: string) => {
    try {
      const appSlug = (input || '').trim().replace(/['"]/g, '');
      const token = await pipedreamService.getOAuthToken();
      const tools = await pipedreamMcpService.listToolsForApp(appSlug, 'architect-discovery', token);
      
      return JSON.stringify(tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      })));
    } catch (err: any) {
      return JSON.stringify({ error: `MCP Fetch failed: ${err.message}` });
    }
  }
});

/**
 * Tool 0.5: Get Platform Operations
 */
export const getPlatformOperationsTool = new DynamicTool({
  name: 'get_platform_operations',
  description: 'Returns the full input/output schema for a specific platform. Input: platform name.',
  func: async (input: string) => {
    try {
      const platform = (input || '').toLowerCase().trim();
      const node = NODE_REGISTRY.find(n => n.label.toLowerCase() === platform || n.id.toLowerCase().includes(platform));
      if (!node) return JSON.stringify({ error: `Platform '${platform}' not found` });
      
      const ops = Object.keys(node.operationInputs || {}).map(op => ({
        name: op,
        inputs: node.operationInputs![op],
        outputs: node.operationOutputs?.[op] || []
      }));
      return JSON.stringify({ platform: node.label, operations: ops });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  }
});

/**
 * Tool 1: Assemble Node Config
 */
export const assembleNodeConfigTool = new DynamicTool({
  name: 'assemble_node_config',
  description: 'Builds complete node config. Input JSON: {platform, operation, staticFields, dynamicFields}.',
  func: async (input: string) => {
    try {
      const { platform, operation, staticFields = {}, dynamicFields = {} } = JSON.parse(input);
      const nodeDef = NODE_REGISTRY.find(n => n.label.toLowerCase() === platform.toLowerCase());
      const inputs = nodeDef?.operationInputs?.[operation] || [];
      const config: any = { operation };
      const missing: string[] = [];

      for (const inputDef of inputs) {
        const { key, required } = inputDef;
        if (key in staticFields) config[key] = staticFields[key];
        else if (key in dynamicFields) config[key] = `{{ ${dynamicFields[key]} }}`;
        else if (required) missing.push(key);
      }
      return JSON.stringify({ config, missingRequired: missing });
    } catch (err: any) {
      return JSON.stringify({ error: `Error: ${err.message}` });
    }
  },
});

/**
 * Tool 2: Generate Final Workflow (One-Step Build)
 */
export const generateFinalWorkflowTool = new DynamicTool({
  name: 'generate_final_workflow',
  description: 'Creates a complete workflow in ONE step. Input JSON: {name, description, nodes, edges}.',
  func: async (input: string) => {
    try {
      const { nodes: rawNodes, name = 'My Workflow', description = '' } = JSON.parse(input);
      if (!rawNodes || !Array.isArray(rawNodes) || rawNodes.length === 0) {
        return JSON.stringify({ error: 'MANDATORY: You must provide a "nodes" array.' });
      }

      const builtNodes: any[] = [];
      const nodeCounters: Record<string, number> = {};

      let triggerIndex = rawNodes.findIndex(n => n.type === 'trigger' || n.category === 'Triggers' || (n.label || '').toLowerCase().includes('trigger'));
      if (triggerIndex === -1) {
        rawNodes.unshift({ type: 'trigger', operation: 'manual', label: 'Manual Trigger' });
        triggerIndex = 0;
      }
      
      const finalRawNodes = [rawNodes[triggerIndex], ...rawNodes.filter((_, i) => i !== triggerIndex)];

      for (const spec of finalRawNodes) {
        const position = { x: builtNodes.length * 300, y: 150 };
        const labelStr = (spec.label || spec.platform || spec.name || '').toLowerCase();
        
        if (builtNodes.length === 0) {
          const triggerKey = spec.operation || (labelStr.includes('chat') ? 'chat' : labelStr.includes('webhook') ? 'webhook' : 'manual');
          const tDef = NODE_REGISTRY.find(n => n.id === `trigger.${triggerKey}`) || NODE_REGISTRY.find(n => n.id === 'trigger.chat')!;
          builtNodes.push({
            id: `trigger_${triggerKey}_1`,
            label: tDef.label,
            data: { label: tDef.label, toolId: tDef.id, isTrigger: true, config: { trigger: triggerKey, ...spec.config } },
            position
          });
          continue;
        }

        const platformName = spec.platform || spec.label || spec.name;
        const pDef = NODE_REGISTRY.find(n => platformName && n.label.toLowerCase() === platformName.toLowerCase());
        const isLLM = spec.type === 'llm' || spec.category === 'Models' || labelStr.includes('gemini') || labelStr.includes('openai');

        if (pDef || isLLM) {
          let toolId = pDef?.id;
          if (isLLM) toolId = labelStr.includes('openai') ? 'llm.openai' : 'llm.gemini';
          if (!toolId) continue;

          const prefix = toolId.replace('.', '_');
          nodeCounters[prefix] = (nodeCounters[prefix] || 0) + 1;
          const id = `${prefix}_${nodeCounters[prefix]}`;
          const config = { ...spec.config };

          if (isLLM) {
            config.model = config.model || (toolId === 'llm.openai' ? 'openai/gpt-4o' : 'google/gemini-2.0-flash-001');
            config.prompt = config.prompt || '{{ message }}';
          }
          builtNodes.push({ id, label: spec.label || pDef?.label || 'AI', data: { label: spec.label || pDef?.label || 'AI', toolId, config }, position });
          continue;
        }

        // Pipedream
        if (spec.appSlug || spec.platform) {
          const slug = spec.appSlug || spec.platform.toLowerCase().replace(/\s+/g, '');
          const id = `pd_${slug}_${(nodeCounters[slug] || 0) + 1}`;
          nodeCounters[slug] = (nodeCounters[slug] || 0) + 1;
          builtNodes.push({
            id,
            label: spec.label || spec.platform,
            data: { label: spec.label || spec.platform, toolId: 'pipedream.action', config: { appSlug: slug, actionName: spec.operation, ...spec.config } },
            position
          });
        }
      }

      const builtEdges = builtNodes.slice(0, -1).map((node, i) => ({
        id: `e-${i}`, source: node.id, target: builtNodes[i + 1].id, sourceHandle: 'output', targetHandle: 'input'
      }));

      return JSON.stringify({ name, description, nodes: builtNodes, edges: builtEdges });
    } catch (err: any) {
      return JSON.stringify({ error: `Failed: ${err.message}` });
    }
  }
});

export const getOperationOutputsTool = new DynamicTool({
  name: 'get_operation_outputs',
  description: 'Returns result fields for a node. Input JSON: {platform, operation}.',
  func: async (input: string) => {
    try {
      const { platform, operation } = JSON.parse(input);
      const node = NODE_REGISTRY.find(n => n.label.toLowerCase() === platform.toLowerCase());
      const outputs = node?.operationOutputs?.[operation] || [];
      return JSON.stringify({ platform, operation, outputs });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  }
});

export const allArchitectTools = [
  getArchitectContextTool,
  searchPipedreamAppsTool,
  getPipedreamAppToolsTool,
  getPlatformOperationsTool,
  assembleNodeConfigTool,
  generateFinalWorkflowTool,
  getOperationOutputsTool,
];
