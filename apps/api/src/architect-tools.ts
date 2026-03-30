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
      const { nodes, edges = [], name = 'My Workflow', description = '' } = data;
      
      if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
        return JSON.stringify({ error: 'MANDATORY: You must provide a "nodes" array. Empty workflows are not allowed.' });
      }

      const builtNodes: any[] = [];

      for (const spec of nodes) {
        // Safe position handling to prevent NaN in frontend
        const position = {
          x: typeof spec.position?.x === 'number' ? spec.position.x : builtNodes.length * 300,
          y: typeof spec.position?.y === 'number' ? spec.position.y : 150
        };
        const { type } = spec;
        const labelStr = (spec.label || spec.platform || spec.name || '').toLowerCase();
        const id = spec.id || `node-${Math.random().toString(36).substr(2, 9)}`;
        const userConfig = spec.config || {};
        
        // 1. Triggers
        if (type === 'trigger' || spec.category === 'Triggers' || labelStr.includes('trigger')) {
          const triggerKey = spec.operation || spec.trigger || (labelStr.includes('chat') ? 'chat' : labelStr.includes('webhook') ? 'webhook' : 'manual');
          const tDef = NODE_REGISTRY.find(n => n.id === `trigger.${triggerKey}`) || NODE_REGISTRY.find(n => n.id === 'trigger.chat')!;
          const labels: any = { chat: 'When chat message received', manual: 'Manual Trigger', webhook: 'Webhook Incoming' };
          builtNodes.push({
            id: id,
            label: labels[triggerKey] || tDef.label,
            data: { 
              label: labels[triggerKey] || tDef.label, 
              isTrigger: true, // Crucial for UI and wiring engine
              config: { trigger: triggerKey, ...userConfig } 
            },
            position
          });
          continue;
        }

        // 2. Platforms
        const platformName = spec.platform || spec.label || spec.name;
        const pDef = NODE_REGISTRY.find(n => platformName && n.label.toLowerCase() === platformName.toLowerCase());
        
        if (pDef && !pDef.isTrigger) {
          const operation = spec.operation || userConfig.operation || Object.keys(pDef.operationInputs || {})[0];
          const schema = pDef.operationInputs?.[operation] || [];
          const finalConfig = { operation, ...userConfig };
          
          // 1. SMART CONFIG MAPPING: If a required field is missing, look for common trigger aliases or UPSTREAM nodes
          schema.filter(i => i.required && !(i.key in finalConfig)).forEach(i => {
            const upstreams = [...builtNodes].reverse();
            
            // A) UPSTREAM CHECK: Look for closest node providing this key or a generic result
            for (const up of upstreams) {
              // Priority 1: AI Agents always provide 'result'
              if (up.data?.executionKey === 'synthesis' || up.id.includes('agent')) {
                finalConfig[i.key] = `{{ nodes.${up.id}.result }}`;
                return;
              }
              // Priority 2: Key Match in Upstream Schema (Fuzzy/Exact)
              const upDef = NODE_REGISTRY.find(n => n.id === up.data.toolId || n.label === up.label);
              if (upDef?.outputSchema?.some(o => o.key === i.key || o.key.includes(i.key))) {
                finalConfig[i.key] = `{{ nodes.${up.id}.${i.key} }}`;
                return;
              }
              // Priority 3: Fallback to generic '.output' for platforms
              if (!up.data?.isTrigger) {
                finalConfig[i.key] = `{{ nodes.${up.id}.output }}`;
                return;
              }
            }

            // B) TRIGGER FALLBACK: If no upstream node found, use the workflow trigger
            const triggerSpec = nodes.find((n: any) => n.type === 'trigger' || n.category === 'Triggers' || (n.label || '').toLowerCase().includes('trigger'));
            const triggerType = triggerSpec?.operation || triggerSpec?.trigger || (triggerSpec?.label?.toLowerCase().includes('chat') ? 'chat' : 'manual');
            
            if (triggerType === 'chat') {
              const textKeys = ['message', 'text', 'body', 'name', 'title', 'query', 'prompt', 'videoId', 'id'];
              finalConfig[i.key] = textKeys.includes(i.key) ? '{{ input.message }}' : `{{ input.${i.key} }}`;
            } else if (triggerType === 'webhook') {
              finalConfig[i.key] = `{{ input.body.${i.key} }}`;
            } else {
              finalConfig[i.key] = `{{ input.${i.key} }}`;
            }
          });

          const op = finalConfig.operation || '';
          const cleanOp = typeof op === 'string' ? op.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) : '';
          const finalLabel = cleanOp ? `${pDef.label} - ${cleanOp}` : pDef.label;

          builtNodes.push({
            id: id,
            label: finalLabel,
            data: { label: finalLabel, toolId: pDef.id, config: finalConfig },
            position
          });
          continue;
        }

        // 3. Model Actions (Gemini, OpenAI, Claude, OpenRouter)
        if (type === 'llm' || type === 'ai_agent' || spec.category === 'Models' || spec.category === 'AI' || spec.executionKey === 'synthesis' || spec.executionKey === 'llm_run') {
          // Resolve provider
          const provider = (spec.label || spec.name || '').toLowerCase();
          const toolId = provider.includes('openai') ? 'llm.openai' : 
                         provider.includes('claude') ? 'llm.claude' : 
                         'llm.gemini';
          
          const modelId = typeof userConfig.model === 'object' ? (userConfig.model.value || userConfig.model.id) : String(userConfig.model || '');

          builtNodes.push({
            id: id || `llm-${builtNodes.length}`,
            label: (spec as any).label || (toolId === 'llm.openai' ? 'OpenAI' : 'Gemini'), 
            data: { 
              label: (spec as any).label || (toolId === 'llm.openai' ? 'OpenAI' : 'Gemini'), 
              toolId: toolId,
              executionKey: 'llm_run', 
              config: { 
                model: modelId || (toolId === 'llm.openai' ? 'openai/gpt-4o' : 'google/gemini-2.0-flash-001'),
                prompt: userConfig.prompt || userConfig.userMessage || '{{ input.message }}',
                ...userConfig 
              } 
            },
            position
          });
          continue;
        }

        // 5. Logic / CoreFallback
        const label = spec.label || spec.platform || 'Node';
        const coreDef = NODE_REGISTRY.find(n => n.label.toLowerCase() === label.toLowerCase()) || 
                       NODE_REGISTRY.find(n => n.category === 'Logic' && n.label.toLowerCase().includes((type || '').toLowerCase()));
        
        builtNodes.push({
          id: id || `node-${builtNodes.length}`,
          label: label,
          data: { 
            label: label, 
            toolId: coreDef?.id || 'unknown',
            executionKey: coreDef?.executionKey || 'unknown',
            config: userConfig 
          },
          position
        });
      }

      // LINEAR WIRING: Auto-connect in strict sequential order (0 -> 1 -> 2)
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
        status: 'Linear workflow built successfully' 
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
