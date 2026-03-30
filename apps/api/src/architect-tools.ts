import { DynamicTool } from '@langchain/core/tools';
import { NODE_REGISTRY } from '@repo/nodes';

/**
 * Tool 0: Get Architect Context (Discovery)
 * Returns triggers, platform tools, and all node types in a single turn.
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
          // SHRUNK: Only return names, not full schemas to avoid token bloat
          data.operations = Object.keys(node.operationInputs).map(op => ({
            name: op,
            description: (node.operationOutputs?.[op]?.[0]?.description) || `Operation: ${op}`
          }));
          platforms.push(data);
        } else {
          data.configFields = node.configFields.filter(f => f.type !== 'notice').map(f => ({
            key: f.key,
            label: f.label,
            type: f.type,
            required: (f as any).required || false,
            default: f.default
          }));
          data.inputs = node.inputs;
          data.outputs = node.outputs;
          core.push(data);
        }
      }

      return JSON.stringify({
        triggers,
        platforms: platforms.slice(0, 100),
        coreNodes: core,
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  }
});

/**
 * Tool 0.5: Get Platform Operations (Optional Deep-Dive)
 */
export const getPlatformOperationsTool = new DynamicTool({
  name: 'get_platform_operations',
  description: 'Returns the full input/output schema for a specific platform (e.g. YouTube, GitHub). Use if you need to know exact field names.',
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
 * Builds the complete config object for a node based on operation schema and intent.
 */
export const assembleNodeConfigTool = new DynamicTool({
  name: 'assemble_node_config',
  description: 'Builds complete node config. Input JSON: {platform, operation, staticFields, dynamicFields}.',
  func: async (input: string) => {
    try {
      const data = JSON.parse(input);
      const { platform, operation, staticFields = {}, dynamicFields = {} } = data;

      if (!platform || !operation) {
        return JSON.stringify({ error: 'Missing: platform or operation' });
      }

      const nodeDef = NODE_REGISTRY.find(n => n.label.toLowerCase() === platform.toLowerCase());
      const inputs = nodeDef?.operationInputs?.[operation] || [];
      const config: any = { operation };
      const missing: string[] = [];

      for (const inputDef of inputs) {
        const { key, required } = inputDef;
        if (key in staticFields) {
          config[key] = staticFields[key];
        } else if (key in dynamicFields) {
          config[key] = `{{ input.${dynamicFields[key]} }}`;
        } else if (required) {
          config[key] = `{{ input.${key} }}`;
          missing.push(key);
        }
      }

      return JSON.stringify({ config, missingRequired: missing });
    } catch (err: any) {
      return JSON.stringify({ error: `Error: ${err.message}` });
    }
  },
});

/**
 * Tool 2: Generate Final Workflow (One-Step Build)
 * Converts an abstract node list into a fully formed executable workflow.
 */
export const generateFinalWorkflowTool = new DynamicTool({
  name: 'generate_final_workflow',
  description: 'Creates a complete workflow in ONE step. Input JSON: {name, description, nodes: [{type, platform, operation, config, label, id, position}], edges: [{source, target}]}.',
  func: async (input: string) => {
    try {
      const data = JSON.parse(input);
      const { nodes: rawNodes, edges = [], name = 'My Workflow', description = '' } = data;
      
      if (!rawNodes || !Array.isArray(rawNodes) || rawNodes.length === 0) {
        return JSON.stringify({ error: 'MANDATORY: You must provide a "nodes" array.' });
      }

      const builtNodes: any[] = [];
      const nodeCounters: Record<string, number> = {};

      // 1. ENSURE SINGLE TRIGGER: Find triggers, pick first, or default to manual
      let triggerIndex = rawNodes.findIndex(n => n.type === 'trigger' || n.category === 'Triggers' || (n.label || '').toLowerCase().includes('trigger'));
      if (triggerIndex === -1) {
        // Insert a manual trigger at the start if missing
        rawNodes.unshift({ type: 'trigger', operation: 'manual', label: 'Manual Trigger' });
        triggerIndex = 0;
      }
      
      // Re-order nodes so trigger is FIRST and there is ONLY ONE
      const triggerNode = rawNodes[triggerIndex];
      const otherNodes = rawNodes.filter((_, i) => i !== triggerIndex && !((_ as any).type === 'trigger' || (_ as any).category === 'Triggers'));
      const finalRawNodes = [triggerNode, ...otherNodes];

      for (const spec of finalRawNodes) {
        const position = {
          x: typeof spec.position?.x === 'number' ? spec.position.x : builtNodes.length * 300,
          y: typeof spec.position?.y === 'number' ? spec.position.y : 150
        };
        
        const labelStr = (spec.label || spec.platform || spec.name || '').toLowerCase();
        const userConfig = spec.config || {};
        
        // A. Trigger Handling
        if (builtNodes.length === 0) {
          const triggerKey = spec.operation || spec.trigger || (labelStr.includes('chat') ? 'chat' : labelStr.includes('webhook') ? 'webhook' : 'manual');
          const tDef = NODE_REGISTRY.find(n => n.id === `trigger.${triggerKey}`) || NODE_REGISTRY.find(n => n.id === 'trigger.chat')!;
          const labels: any = { chat: 'When chat message received', manual: 'Manual Trigger', webhook: 'Webhook Incoming' };
          
          const id = `trigger_${triggerKey}_1`;
          builtNodes.push({
            id,
            label: labels[triggerKey] || tDef.label,
            data: { 
              label: labels[triggerKey] || tDef.label, 
              toolId: tDef.id,
              isTrigger: true,
              config: { trigger: triggerKey, ...userConfig } 
            },
            position
          });
          continue;
        }

        // B. Action Nodes
        const platformName = spec.platform || spec.label || spec.name;
        const pDef = NODE_REGISTRY.find(n => platformName && n.label.toLowerCase() === platformName.toLowerCase());
        const isLLM = spec.type === 'llm' || spec.category === 'Models' || labelStr.includes('gemini') || labelStr.includes('openai');

        if (pDef || isLLM) {
          let toolId = pDef?.id;
          if (isLLM) {
             toolId = labelStr.includes('openai') ? 'llm.openai' : 
                      labelStr.includes('claude') ? 'llm.claude' : 'llm.gemini';
          }
          if (!toolId) continue;

          // Generate Human-Readable ID
          const prefix = toolId.replace('.', '_');
          nodeCounters[prefix] = (nodeCounters[prefix] || 0) + 1;
          const id = `${prefix}_${nodeCounters[prefix]}`;

          const finalConfig = { ...userConfig };
          if (pDef && !pDef.isTrigger) {
             finalConfig.operation = spec.operation || userConfig.operation || Object.keys(pDef.operationInputs || {})[0];
          } else if (isLLM) {
             finalConfig.model = userConfig.model || (toolId === 'llm.openai' ? 'openai/gpt-4o' : 'google/gemini-2.0-flash-001');
             finalConfig.prompt = userConfig.prompt || userConfig.userMessage || '{{ input.message }}';
          }

          // SMART VARIABLE MAPPING (New Format {{ id.field }})
          // We apply this to any string field that looks like a variable placeholder
          Object.keys(finalConfig).forEach(key => {
            if (typeof finalConfig[key] === 'string') {
              // Replace old {{ nodes.ID.field }} with {{ ID.field }}
              finalConfig[key] = finalConfig[key].replace(/\{\{\s*nodes\.([\s\S]+?)\.([\s\S]+?)\s*\}\}/g, '{{ $1.$2 }}');
              // Replace {{ input.message }} with {{ message }} (cleaner)
              finalConfig[key] = finalConfig[key].replace(/\{\{\s*input\.message\s*\}\}/g, '{{ message }}');
            }
          });

          const label = spec.label || pDef?.label || (toolId === 'llm.openai' ? 'OpenAI' : 'Gemini');

          builtNodes.push({
            id,
            label,
            data: { label, toolId, config: finalConfig },
            position
          });
          continue;
        }
      }

      // LINEAR WIRING: Auto-connect
      const builtEdges = builtNodes.slice(0, -1).map((node, i) => {
        const nextNode = builtNodes[i + 1];
        return {
          id: `e-linear-${i}-${Date.now()}`,
          source: node.id,
          target: nextNode.id,
          sourceHandle: 'output',
          targetHandle: 'input'
        };
      });

      return JSON.stringify({ 
        name, 
        description, 
        nodes: builtNodes, 
        edges: builtEdges, 
        status: 'Sequential workflow built successfully' 
      });
    } catch (err: any) {
      return JSON.stringify({ error: `Failed to build workflow: ${err.message}` });
    }
  }
});

/**
 * Tool 3: Get Operation Outputs
 * Shared with LLM to help with dynamic reference mapping {{ nodes.Label.field }}.
 */
export const getOperationOutputsTool = new DynamicTool({
  name: 'get_operation_outputs',
  description: 'Returns what result fields a node produces. Use to build {{ nodes.Label.field }} references. Input JSON: {platform, operation}.',
  func: async (input: string) => {
    try {
      const { platform, operation } = JSON.parse(input);
      const node = NODE_REGISTRY.find(n => n.label.toLowerCase() === platform.toLowerCase());
      const outputs = node?.operationOutputs?.[node.isTrigger ? 'default' : operation] || [];
      return JSON.stringify({ platform, operation, outputs });
    } catch (err) {
      return JSON.stringify({ error: 'Provide valid JSON: {platform, operation}' });
    }
  }
});

// Final Export List (Highly Simplified)
export const allArchitectTools = [
  getArchitectContextTool,
  getPlatformOperationsTool,
  assembleNodeConfigTool,
  generateFinalWorkflowTool,
  getOperationOutputsTool,
];
