import { DynamicTool } from '@langchain/core/tools';
import { NODE_REGISTRY } from '@repo/nodes';
import OpenAI from 'openai';

// Ensure OPENAI_API_KEY is set to OPENROUTER_API_KEY for the OpenAI client
if (!process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENROUTER_API_KEY;
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'warewe AI Architect',
  },
});

/**
 * Tool 0: Choose Trigger Type
 * Determines which trigger should start the workflow
 */
export const chooseTriggerTool = new DynamicTool({
  name: 'choose_trigger',
  description:
    'Choose the appropriate trigger for the workflow. Input: user prompt. Returns: trigger type (chat/manual/webhook)',
  func: async (input: string) => {
    try {
      // Find trigger node definitions
      const triggerNode = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase().includes('chat message') ||
               n.id === 'trigger.chat'
      );
      const manualNode = NODE_REGISTRY.find((n) => n.id === 'trigger.manual');
      const webhookNode = NODE_REGISTRY.find((n) => n.id === 'trigger.webhook');

      const response = await openai.chat.completions.create({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 256,
        messages: [
          {
            role: 'system',
            content: `Choose the best trigger for a workflow based on the user's prompt.

Trigger options:
1. "chat" - Chat Trigger - for interactive chat workflows. Use when: "chat", "message", "user sends", "interactive", "ask"
2. "manual" - Manual Trigger - for manual/automated tasks. Use when: regular automation, batch job, scheduled task, or default
3. "webhook" - Webhook Trigger - for external integrations. Use when: "webhook", "API", "HTTP", "external system", "integration"

Return ONLY a JSON object: { "trigger": "chat|manual|webhook", "reason": "brief reason" }`,
          },
          {
            role: 'user',
            content: `Choose trigger for: "${input}"`,
          },
        ],
      });

      const content = response.choices[0]?.message.content || '{}';
      const parsed = JSON.parse(content);

      if (!['chat', 'manual', 'webhook'].includes(parsed.trigger)) {
        return JSON.stringify({
          trigger: 'chat', // Default to chat
          reason: 'Could not determine, defaulting to chat trigger',
        });
      }

      return JSON.stringify(parsed);
    } catch (err) {
      return JSON.stringify({
        trigger: 'chat',
        reason: 'Error in selection, defaulting to chat',
      });
    }
  },
});

/**
 * Tool 1: Extract Intent from User Prompt
 */
export const extractIntentTool = new DynamicTool({
  name: 'extract_intent',
  description:
    'Extract structured intent: platforms, operations, static values, dynamic fields. Returns data to build node configs.',
  func: async (input: string) => {
    try {
      const response = await openai.chat.completions.create({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `Extract all actionable information from the user prompt to build workflow nodes.

Return JSON ONLY (no explanations):

{
  "platforms": ["Gmail", "GitHub"],
  "primaryOperation": "send",  // The main action
  "additionalOperations": [],  // Other operations if multiple actions
  "intent": "One sentence describing what the workflow does",
  "staticFields": {
    "to": "john@example.com",    // Literal values explicitly in prompt
    "owner": "microsoft",
    "repo": "vscode"
  },
  "dynamicFields": {
    "subject": "subject",        // Field name → how to reference it ({{ input.subject }})
    "body": "message",          // { body: "message" } means use {{ input.message }}
    "email": "recipientEmail"   // { email: "recipientEmail" } means use {{ input.recipientEmail }}
  },
  "dataFlow": "single|multiple",  // single: one action. multiple: chain of actions
  "explanation": "Brief explanation of extracted values"
}

RULES FOR EXTRACTION:
1. staticFields: Any value explicitly named in prompt is literal
   - "send to alice@example.com" → staticFields.to = "alice@example.com"
   - "create in microsoft/vscode repo" → staticFields.owner = "microsoft", repo = "vscode"

2. dynamicFields: Any value marked as "from user", "from chat", "provided" is dynamic
   - "send to the user's email from chat" → dynamicFields.to = "email" (use {{ input.email }})
   - "message from chat input" → dynamicFields.body = "message" (use {{ input.message }})

3. primaryOperation: The main operation (send, create, search, etc)

4. dataFlow:
   - "single" if one action (e.g., just send email)
   - "multiple" if chain (e.g., search GitHub then send results via email)`,
          },
          {
            role: 'user',
            content: `Extract intent from: "${input}"`,
          },
        ],
      });

      const content = response.choices[0]?.message.content || '{}';
      return content;
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool 2: List All Operations
 */
export const listOperationsTool = new DynamicTool({
  name: 'list_all_operations',
  description:
    'Get all available operations. Pass platform name to filter (GitHub, Slack, Gmail, etc.)',
  func: async (input: string) => {
    try {
      const platform = input || '';
      const operations: any[] = [];

      for (const node of NODE_REGISTRY) {
        if (platform && node.label.toLowerCase() !== platform.toLowerCase()) {
          continue;
        }

        const operationInputs = node.operationInputs || {};

        for (const [operation, inputs] of Object.entries(operationInputs)) {
          const requiredInputs = (inputs as any[])
            .filter((i: any) => i.required)
            .map((i: any) => i.key);
          const optionalInputs = (inputs as any[])
            .filter((i: any) => !i.required)
            .map((i: any) => i.key);

          // Infer resource for Google nodes
          const resourceField = node.configFields.find(f => f.key === 'resource');
          const resources = Array.isArray(resourceField?.options) 
            ? (resourceField!.options as any[]).map(o => typeof o === 'string' ? o : o.value)
            : [];
          
          let potentialResource = "";
          if (resources.length > 0) {
              potentialResource = resources.find(r => 
                operation.toLowerCase().includes(r.toLowerCase()) || 
                r.toLowerCase().includes(operation.toLowerCase())
              ) || resources[0] || "";
          }

          operations.push({
            platform: node.label,
            operation,
            resource: potentialResource,
            required: requiredInputs,
            optional: optionalInputs,
            description: (inputs as any[])?.[0]?.description ? `${node.description} - ${(inputs as any[])[0].description}` : node.description,
          });
        }
      }

      return JSON.stringify({
        total: operations.length,
        operations: operations.slice(0, 20), // Limit output
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool 3: Get Operation Schema
 */
export const getOperationSchemaTool = new DynamicTool({
  name: 'get_operation_schema',
  description:
    'Get schema for specific operation. Pass JSON: {platform, operation}',
  func: async (input: string | any) => {
    try {
      let platform, operation;

      // Handle both string and object inputs
      let data = input;
      if (typeof input === 'string') {
        if (input.startsWith('{')) {
          data = JSON.parse(input);
        } else {
          const parts = input.split(',').map((s) => s.trim());
          data = { platform: parts[0], operation: parts[1] };
        }
      }

      platform = data.platform;
      operation = data.operation;

      if (!platform || !operation) {
        return JSON.stringify({
          error: 'Invalid input format. Use: platform,operation',
        });
      }

      const node = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === platform.toLowerCase()
      );

      if (!node) {
        return JSON.stringify({
          error: `Platform "${platform}" not found`,
        });
      }

      const allOps: any[] = [];
      NODE_REGISTRY.forEach(n => {
        Object.keys(n.operationInputs || {}).forEach(op => {
          allOps.push({ platform: n.label, operation: op, node: n });
        });
      });

      const matchedOp = allOps.find(o => 
        o.platform.toLowerCase() === platform.toLowerCase() && 
        o.operation.toLowerCase() === operation.toLowerCase()
      );

      const opNode = matchedOp?.node || node;
      const canonicalOp = matchedOp?.operation || operation;
      const schema = opNode.operationInputs?.[canonicalOp];

      if (!schema) {
        return JSON.stringify({
          error: `Operation "${operation}" not found for platform "${platform}"`,
        });
      }

      // Infer resource
      const resourceField = opNode.configFields.find((f: any) => f.key === 'resource');
      const resources = Array.isArray(resourceField?.options) 
        ? (resourceField!.options as any[]).map(o => typeof o === 'string' ? o : o.value)
        : [];
      const resource = resources.find((r: string) => 
        canonicalOp.toLowerCase().includes(r.toLowerCase()) || 
        r.toLowerCase().includes(canonicalOp.toLowerCase())
      ) || resources[0] || "";

      return JSON.stringify({
        platform,
        operation: canonicalOp,
        resource,
        inputs: schema.map((i: any) => ({
          key: i.key,
          required: i.required,
          type: i.type,
          description: i.description,
        })),
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool 4: Validate Configuration
 */
export const validateConfigTool = new DynamicTool({
  name: 'validate_config',
  description:
    'Validate node config. Pass JSON: {platform, operation, config_object}',
  func: async (input: string) => {
    try {
      let platform, operation, configStr;

      // Try to parse as JSON first
      if (input.startsWith('{')) {
        const parsed = JSON.parse(input);
        platform = parsed.platform;
        operation = parsed.operation;
        configStr = JSON.stringify(parsed.config_object || parsed.config || {});
      } else {
        // Fall back to separator-based parsing
        const parts = input.split('|||');
        platform = parts[0]?.trim();
        operation = parts[1]?.trim();
        configStr = parts[2]?.trim();
      }

      if (!platform || !operation || !configStr) {
        return JSON.stringify({ valid: false, error: 'Invalid input format' });
      }

      const node = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === platform.toLowerCase()
      );

      if (!node) {
        return JSON.stringify({ valid: false, error: 'Platform not found' });
      }

      const schema = node.operationInputs?.[operation];

      if (!schema) {
        return JSON.stringify({ valid: false, error: 'Operation not found' });
      }

      const config = JSON.parse(configStr);
      const errors: string[] = [];

      for (const requiredInput of schema.filter((i: any) => i.required)) {
        if (!config[requiredInput.key]) {
          errors.push(`Missing: ${requiredInput.key}`);
        }
      }

      if (errors.length > 0) {
        return JSON.stringify({ valid: false, errors });
      }

      return JSON.stringify({ valid: true });
    } catch (err) {
      return JSON.stringify({ valid: false, error: String(err) });
    }
  },
});

/**
 * Tool 4b: Transform Config Values (NEW)
 * Convert placeholder/test values to dynamic references where needed
 */
export const transformConfigTool = new DynamicTool({
  name: 'transform_config',
  description:
    'Transform node config to use dynamic references based on intent analysis. Input: JSON with {config, dynamicFields, staticFields}',
  func: async (input: string) => {
    try {
      let data;
      if (input.startsWith('{')) {
        data = JSON.parse(input);
      } else {
        data = JSON.parse(input);
      }

      const config = data.config || {};
      const dynamicFields = data.dynamicFields || {}; // { fieldKey: "inputName" }
      const staticFields = data.staticFields || {}; // { fieldKey: "value" }

      // Transform config values
      const transformed: any = {};

      for (const [key, value] of Object.entries(config)) {
        // Check if this field is marked as dynamic from intent extraction
        if (dynamicFields[key]) {
          transformed[key] = `{{ input.${dynamicFields[key]} }}`;
        }
        // Check if this field is marked as static with explicit value
        else if (staticFields[key]) {
          transformed[key] = staticFields[key];
        }
        // Heuristic: detect placeholder/test values and convert to dynamic
        else if (typeof value === 'string' &&
                   (value === 'test_user' || value === 'example' || value === 'placeholder' ||
                    value.includes('given') || value === 'user' || value === 'test' ||
                    value.match(/^[A-Z_\s]+$/) && value.length > 3)) {
          // These look like placeholders - suggest dynamic reference
          const suggestedField = key === 'owner' ? 'githubUser' :
                               key === 'username' ? 'githubUser' :
                               key === 'query' ? 'searchQuery' :
                               key === 'q' ? 'searchQuery' :
                               key === 'channel' ? 'channelName' :
                               key === 'email' ? 'userEmail' :
                               key === 'message' ? 'message' : key;
          transformed[key] = `{{ input.${suggestedField} }}`;
        } else {
          // Keep literal values as-is
          transformed[key] = value;
        }
      }

      return JSON.stringify({
        config: transformed,
        notes: 'Config transformed: dynamic fields use {{ input.name }}, static fields kept as literals',
      });
    } catch (err: any) {
      console.error('[transformConfigTool] Error:', err.message);
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool 5: Assemble Node Config
 * Builds the complete config object for a node based on operation schema and extracted intent
 */
export const assembleNodeConfigTool = new DynamicTool({
  name: 'assemble_node_config',
  description:
    'Builds complete node config. Input: {platform, operation, operationSchema, staticFields, dynamicFields}. Output: complete config object',
  func: async (input: string) => {
    try {
      let data;
      if (input.startsWith('{')) {
        data = JSON.parse(input);
      } else {
        return JSON.stringify({
          error: 'Input must be JSON object with platform, operation, operationSchema, staticFields, dynamicFields',
        });
      }

      const { platform, operation, operationSchema, staticFields = {}, dynamicFields = {} } = data;

      if (!platform || !operation || !operationSchema) {
        return JSON.stringify({
          error: 'Missing: platform, operation, or operationSchema',
        });
      }

      // Check if schema is a raw array or the full object from get_operation_schema
      const inputs = Array.isArray(operationSchema) 
        ? operationSchema 
        : (operationSchema.inputs || []);

      if (!Array.isArray(inputs)) {
        return JSON.stringify({ error: 'operationSchema must be an array or contain an inputs array' });
      }

      // Build config by iterating through operation schema
      const config: any = {
        operation,
      };

      const missingRequired: string[] = [];

      for (const inputDef of inputs) {
        const { key, required } = inputDef;

        // Check: is this in staticFields (literal value)?
        if (key in staticFields) {
          config[key] = staticFields[key];
          continue;
        }

        // Check: is this in dynamicFields (from user input)?
        if (key in dynamicFields) {
          const inputName = dynamicFields[key];
          config[key] = `{{ input.${inputName} }}`;
          continue;
        }

        // Check: is this required?
        if (required) {
          // Use dynamic reference - field name as the input name
          config[key] = `{{ input.${key} }}`;
          missingRequired.push(key);
        }
        // else: optional field not provided, skip it
      }

      return JSON.stringify({
        config,
        resource: data.resource || "",
        missingRequired: missingRequired.length > 0 ? missingRequired : [],
        status: missingRequired.length > 0 ? 'Config built with dynamic references for missing required fields' : 'Config complete',
      });
    } catch (err: any) {
      return JSON.stringify({ error: `Error assembling config: ${err.message}` });
    }
  },
});

/**
 * Tool 6: Build Nodes (including triggers)
 * Constructs proper node objects with complete data fields
 */
export const buildNodesTool = new DynamicTool({
  name: 'build_nodes',
  description:
    'Build complete node objects with ALL parameters. Input: JSON with {nodes: [{type: "trigger|platform", trigger: "chat|manual|webhook", platform, operation, config, id, position}]}',
  func: async (input: string) => {
    try {
      let spec: any;

      if (input.startsWith('{')) {
        spec = JSON.parse(input);
      } else {
        return JSON.stringify({
          error: 'Input must be JSON object with nodes array',
        });
      }

      const nodeSpecs = Array.isArray(spec) ? spec : (spec.nodes || [spec]);
      const builtNodes = [];

      for (const nodeSpec of nodeSpecs) {
        const { type, trigger, platform, operation, config = {}, id, position = { x: 0, y: 0 }, ...rest } = nodeSpec;

        // Merge flat parameters into config (if any)
        const finalConfig = { ...rest, ...config };

        // VALIDATION: Check for empty/missing critical fields
        if (type === 'platform' && (!platform || !operation)) {
          return JSON.stringify({
            error: `Platform node missing critical fields`,
            received: { type, platform: `"${platform || ''}"`, operation: `"${operation || ''}"` },
            help: 'Every platform node MUST have: type: "platform", platform: "PlatformName", operation: "operationName"',
            example: { type: 'platform', platform: 'YouTube', operation: 'getChannelStats', config: {}, id: 'youtube-1', position: { x: 0, y: 0 } }
          });
        }

        // Handle trigger nodes
        if (type === 'trigger' || trigger) {
          const triggerType = trigger || 'manual';
          let triggerNode: any;
          let triggerLabel = '';

          if (triggerType === 'chat') {
            triggerNode = NODE_REGISTRY.find((n) => n.id === 'trigger.chat');
            triggerLabel = 'When chat message received';
          } else if (triggerType === 'webhook') {
            triggerNode = NODE_REGISTRY.find((n) => n.id === 'trigger.webhook');
            triggerLabel = 'Webhook';
          } else {
            triggerNode = NODE_REGISTRY.find((n) => n.id === 'trigger.manual');
            triggerLabel = "When clicking 'Execute workflow'";
          }

          if (!triggerNode) {
            return JSON.stringify({
              error: `Trigger "${triggerType}" not found in registry`,
            });
          }

          const triggerConfig = { ...finalConfig };
          if (triggerType === 'chat' && !triggerConfig.responseMode) {
            triggerConfig.responseMode = 'When execution is finished';
          }

          // IMPORTANT: Nest config in data.config for normalizeArchitectNodes
          const node = {
            id: id || `trigger-${triggerType}`,
            label: triggerLabel,
            data: {
              label: triggerLabel,
              config: triggerConfig,
            },
            position,
          };

          builtNodes.push(node);
          continue;
        }

        // Handle platform/connector nodes
        if (!platform) {
          return JSON.stringify({
            error: `Node spec missing 'type', 'trigger', or 'platform'`,
            received: spec,
          });
        }

        if (!operation) {
          return JSON.stringify({
            error: `Platform node missing 'operation' field`,
            platform,
            received: spec,
          });
        }

        // Find the node definition to validate
        const nodeDef = NODE_REGISTRY.find(
          (n) => n.label.toLowerCase() === platform.toLowerCase()
        );

        if (!nodeDef) {
          return JSON.stringify({
            error: `Platform "${platform}" not found in registry`,
            availablePlatforms: NODE_REGISTRY.filter((n) => !n.isTrigger).map((n) => n.label),
          });
        }

        const schema = nodeDef.operationInputs?.[operation];

        if (!schema) {
          return JSON.stringify({
            error: `Operation "${operation}" not found for platform "${platform}"`,
            availableOperations: Object.keys(nodeDef.operationInputs || {}),
          });
        }

        // AUTO-INFER RESOURCE IF MISSING
        let finalResource = (nodeSpec as any).resource || (finalConfig as any).resource || "";
        if (!finalResource) {
          const resourceField = nodeDef.configFields.find((f: any) => f.key === 'resource');
          const resources = Array.isArray(resourceField?.options) 
            ? (resourceField!.options as any[]).map(o => typeof o === 'string' ? o : o.value)
            : [];
          
          if (resources.length > 0) {
              finalResource = resources.find((r: string) => 
                operation.toLowerCase().includes(r.toLowerCase()) || 
                r.toLowerCase().includes(operation.toLowerCase())
              ) || resources[0] || "";
          }
        }

        // Validate that all required inputs are present
        const missingRequired = [];
        for (const inputDef of schema.filter((i: any) => i.required)) {
          if (!(inputDef.key in finalConfig)) {
            missingRequired.push(`${inputDef.key} (required)`);
          }
        }

        if (missingRequired.length > 0) {
          return JSON.stringify({
            error: `Missing required inputs for ${operation}: ${missingRequired.join(', ')}`,
            required: schema.filter((i: any) => i.required).map((i: any) => i.key),
            optional: schema.filter((i: any) => !i.required).map((i: any) => i.key),
            provided: Object.keys(config),
          });
        }

        // Build the node
        // IMPORTANT: Nest config in data.config so normalizeArchitectNodes can find it
        const node = {
          id: id || `${platform.toLowerCase()}-${operation}`,
          label: platform,
          data: {
            label: platform,
            config: {
              ...(finalResource ? { resource: finalResource } : {}),
              operation,
              ...finalConfig,
            },
          },
          position,
        };

        builtNodes.push(node);
      }

      return JSON.stringify({
        nodes: builtNodes,
        count: builtNodes.length,
        status: 'All nodes built successfully',
      });
    } catch (err: any) {
      console.error('[buildNodesTool] Error:', err.message);
      return JSON.stringify({ error: `${err.message}` });
    }
  },
});

/**
 * Tool 6: Build Workflow
 */
export const buildWorkflowTool = new DynamicTool({
  name: 'build_workflow',
  description: 'Build final workflow JSON. Input: JSON with {name, description, nodes, edges}',
  func: async (input: string) => {
    try {
      let data;
      // Try to parse as JSON first
      if (input.startsWith('{')) {
        try {
          data = JSON.parse(input);
        } catch (e) {
          // If parsing fails, try parsing as a stringified string
          const unescaped = input.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          data = JSON.parse(unescaped);
        }
      } else {
        data = JSON.parse(input);
      }

      return JSON.stringify({
        name: data.name,
        description: data.description,
        nodes: data.nodes || [],
        edges: data.edges || [],
        explanation: `Workflow: ${data.name}`,
      });
    } catch (err: any) {
      console.error('[buildWorkflowTool] Error:', err.message, 'Input:', input.substring(0, 200));
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool: Get Operation Outputs (NEW)
 * Returns what data an operation produces
 */
export const getOperationOutputsTool = new DynamicTool({
  name: 'get_operation_outputs',
  description: 'Get output schema for a specific operation. Pass JSON: {platform, operation}. Returns what data this operation produces.',
  func: async (input: any) => {
    try {
      let platform, operation;

      // Handle both string and object inputs
      let data = input;
      if (typeof input === 'string') {
        if (input.startsWith('{')) {
          data = JSON.parse(input);
        } else {
          const parts = input.split(',').map((s) => s.trim());
          data = { platform: parts[0], operation: parts[1] };
        }
      }

      platform = data.platform;
      operation = data.operation;

      if (!platform || !operation) {
        return JSON.stringify({ error: 'Use JSON: {platform, operation}' });
      }

      const node = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === platform.toLowerCase()
      );

      if (!node) {
        return JSON.stringify({ error: `Platform "${platform}" not found` });
      }

      // For triggers, use "default" key
      const opKey = node.isTrigger ? 'default' : operation;
      const outputs = node.operationOutputs?.[opKey];

      if (!outputs) {
        return JSON.stringify({
          error: `No output schema for ${operation}`,
          hint: 'operationOutputs not defined for this operation',
        });
      }

      return JSON.stringify({
        platform,
        operation,
        outputs: outputs.map((o: any) => ({
          key: o.key,
          type: o.type,
          description: o.description,
        })),
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool: Validate Data Flow (NEW)
 * Checks if output from one node can connect to input of another
 */
export const validateDataFlowTool = new DynamicTool({
  name: 'validate_data_flow',
  description: 'Check if node output is compatible with input. Pass JSON: {sourcePlatform, sourceOperation, targetPlatform, targetOperation, targetInput}',
  func: async (input: any) => {
    try {
      // Handle both string and object inputs
      let data = input;
      if (typeof input === 'string') {
        data = JSON.parse(input);
      }

      const {
        sourcePlatform,
        sourceOperation,
        targetPlatform,
        targetOperation,
        targetInput,
      } = data;

      if (
        !sourcePlatform ||
        !sourceOperation ||
        !targetPlatform ||
        !targetOperation ||
        !targetInput
      ) {
        return JSON.stringify({ error: 'Missing required fields' });
      }

      // Get source outputs
      const sourceNode = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === sourcePlatform.toLowerCase()
      );
      const sourceOpKey = sourceNode?.isTrigger ? 'default' : sourceOperation;
      const sourceOutputs = sourceNode?.operationOutputs?.[sourceOpKey] || [];

      // Get target inputs
      const targetNode = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === targetPlatform.toLowerCase()
      );
      const targetInputs = targetNode?.operationInputs?.[targetOperation] || [];

      // Find the target input
      const targetInputDef = targetInputs.find(
        (i: any) => i.key.toLowerCase() === targetInput.toLowerCase()
      );

      if (!targetInputDef) {
        return JSON.stringify({
          error: `Input "${targetInput}" not found`,
          availableInputs: targetInputs.map((i: any) => i.key),
        });
      }

      // Find compatible outputs
      const compatibleOutputs = sourceOutputs.filter((o: any) => {
        const srcType = o.type || 'string';
        const tgtType = targetInputDef.type || 'string';

        // Simple type compatibility
        if (srcType === tgtType) return true;
        if (srcType === 'number' && tgtType === 'string') return true;
        if (srcType === 'array' && tgtType === 'string') return true;
        return false;
      });

      return JSON.stringify({
        valid: compatibleOutputs.length > 0,
        compatibleOutputs: compatibleOutputs.map((o: any) => o.key),
        bestMatch: compatibleOutputs[0]?.key || null,
        targetInput,
        recommendation: compatibleOutputs.length > 0
          ? `Use {{ nodes.<id>.${compatibleOutputs[0]?.key} }}`
          : 'No compatible outputs. Use {{ input.X }}',
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * Tool: Resolve Dynamic References (NEW)
 * Intelligently maps node outputs to input fields
 */
export const resolveDynamicReferencesTool = new DynamicTool({
  name: 'resolve_dynamic_references',
  description: 'Map node outputs to input fields intelligently. Pass: {targetPlatform, targetOperation, availableNodes}',
  func: async (input: any) => {
    try {
      // Handle both string and object inputs
      let data = input;
      if (typeof input === 'string') {
        data = JSON.parse(input);
      }

      const { targetPlatform, targetOperation, availableNodes = [] } = data;

      if (!targetPlatform || !targetOperation) {
        return JSON.stringify({ error: 'Missing targetPlatform or targetOperation' });
      }

      const targetNode = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === targetPlatform.toLowerCase()
      );

      if (!targetNode) {
        return JSON.stringify({ error: `Platform "${targetPlatform}" not found` });
      }

      const targetInputs = targetNode.operationInputs?.[targetOperation] || [];
      const resolvedFields: any = {};
      const unresolvedInputs: string[] = [];

      // For each required input
      for (const inputDef of targetInputs.filter((i: any) => i.required)) {
        const inputKey = inputDef.key;
        let found = false;

        // Try to find matching output from available nodes
        for (const availNode of availableNodes) {
          const sourceNode = NODE_REGISTRY.find(
            (n) => n.label.toLowerCase() === availNode.platform.toLowerCase()
          );
          const opKey = sourceNode?.isTrigger ? 'default' : availNode.operation;
          const outputs = sourceNode?.operationOutputs?.[opKey] || [];

          // Exact key match
          const match = outputs.find(
            (o: any) => o.key.toLowerCase() === inputKey.toLowerCase()
          );

          if (match) {
            resolvedFields[inputKey] = `{{ nodes.${availNode.id}.${match.key} }}`;
            found = true;
            break;
          }
        }

        // If not found, fallback to user input
        if (!found) {
          resolvedFields[inputKey] = `{{ input.${inputKey} }}`;
          unresolvedInputs.push(inputKey);
        }
      }

      return JSON.stringify({
        resolvedFields,
        unresolvedInputs,
        status: unresolvedInputs.length === 0 ? 'All inputs resolved from node outputs' : `${unresolvedInputs.length} inputs require user input`,
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});

/**
 * All tools (in order of use)
 */
export const allArchitectTools = [
  chooseTriggerTool,
  extractIntentTool,
  listOperationsTool,
  getOperationSchemaTool,
  getOperationOutputsTool,
  validateDataFlowTool,
  resolveDynamicReferencesTool,
  assembleNodeConfigTool,
  buildNodesTool,
  buildWorkflowTool,
];
