import { ChatOpenAI } from '@langchain/openai';
import { allArchitectTools } from './architect-tools.js';

/**
 * Execute a tool and return its result
 */
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  const tool = allArchitectTools.find(t => t.name === toolName);
  if (!tool) {
    return JSON.stringify({ error: `Tool ${toolName} not found` });
  }
  try {
    // Tools expect the 'input' field if it's a simple input tool
    // Or the whole object as a string if it's a complex tool
    let inputStr: string;
    if (toolInput.input !== undefined) {
      // Simple input - pass just the value
      inputStr = toolInput.input;
    } else {
      // Complex input - stringify the whole thing
      inputStr = JSON.stringify(toolInput);
    }
    const result = await tool.func(inputStr);
    return result;
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

/**
 * Generate a workflow based on user prompt using LangGraph agent
 */
export async function generateWorkflow(prompt: string): Promise<any> {
  try {
    // Initialize the model with tool binding - configured for OpenRouter
    const model = new ChatOpenAI({
      modelName: 'google/gemini-2.0-flash-001',
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.7,
      maxTokens: 4096,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'warewe AI Architect',
        },
      },
    });

    // Bind tools to the model for function calling
    const modelWithTools = model.bindTools(allArchitectTools);

    const systemPrompt = `You are the Aether Workflow Architect. Your job is to generate COMPLETE, EXECUTABLE workflows that users can immediately run.

🚀 CRITICAL RULE: EVERY workflow MUST start with a TRIGGER node. Without a trigger, the workflow cannot execute.

## AVAILABLE TRIGGERS (choose ONE as first node):
- **Chat Trigger**: "When chat message received" - for interactive chat workflows. User sends a message → workflow runs.
  Use when: prompt mentions "chat", "message", "user input", "interactive", "ask user"
  Output data: {{ input.message }}, {{ input.input }} - contains the user's chat message

- **Manual Trigger**: "When clicking 'Execute workflow'" - for manual/scheduled workflows. User clicks Run button.
  Use when: prompt is about automation task, batch job, or doesn't need user input
  Output data: simple trigger signal

- **Webhook Trigger**: "Webhook" - for HTTP-triggered workflows. External system sends data to a URL.
  Use when: prompt mentions "webhook", "API", "HTTP request", "external system", "integration"
  Output data: {{ input.body }}, {{ input.query }}, {{ input.headers }}

## AVAILABLE PLATFORMS & OPERATIONS:
- GitHub, Slack, Google Drive, Google Sheets, Gmail, Google Calendar, Linear, Notion, Supabase, YouTube
- Each has 20+ operations (e.g., Gmail: send, search, reply, delete; GitHub: create issue, list repos, etc.)

## COMPLETE NODE STRUCTURE:
Every node MUST look like this:
\`\`\`json
{
  "id": "trigger-chat",
  "label": "When chat message received",
  "data": {
    "responseMode": "When execution is finished"
  },
  "position": { "x": 0, "y": 0 }
}
\`\`\`

Connector nodes (Gmail, GitHub, etc.) MUST have:
\`\`\`json
{
  "id": "gmail-1",
  "label": "Gmail",
  "data": {
    "operation": "send",
    "to": "{{ input.recipientEmail }}",
    "subject": "Invoice Report",
    "body": "Please find attached your report"
  },
  "position": { "x": 200, "y": 0 }
}
\`\`\`

## DATA MAPPING IN CONFIG FIELDS:
- Literal values from prompt: "send to alice@example.com" → "to": "alice@example.com"
- From trigger message: "to the user's email" → "to": "{{ input.email }}"
- From previous node output: "the issues found by GitHub" → use {{ nodes.github-1.issues }}
- Default/optional fields: "state": "open" or state: "{{ input.state }}"

## UNDERSTANDING NODE DATA FLOW (CRITICAL):

EVERY operation produces outputs that can be referenced downstream:

Examples:
- YouTube.getChannelStats outputs: views, subscribers, title, videoCount, url
- Gmail.send outputs: messageId, status, timestamp
- Chat Trigger outputs: message, input, userId, timestamp

### When building configs for downstream nodes:

1. Call get_operation_outputs for EACH previous node
   Input: {platform: "YouTube", operation: "getChannelStats"}
   Output: {outputs: [{key: "views", type: "number"}, {key: "subscribers", type: "number"}, ...]}

2. Call validate_data_flow to check compatibility
   Input: {sourcePlatform: "YouTube", sourceOperation: "getChannelStats", targetPlatform: "Gmail", targetOperation: "send", targetInput: "body"}
   Output: {valid: true, compatibleOutputs: ["views", "subscribers", "title"]}

3. Call resolve_dynamic_references to intelligently map outputs to inputs
   Input: {targetPlatform: "Gmail", targetOperation: "send", availableNodes: [{id: "youtube-1", platform: "YouTube", operation: "getChannelStats"}]}
   Output: {resolvedFields: {to: "{{ input.email }}", body: "{{ nodes.youtube-1.views }}"}}

4. Use resolved fields in assemble_node_config

### CRITICAL RULE:
ALWAYS prefer node outputs over user input placeholders:
- GOOD: "body": "{{ nodes.youtube-1.views }}" ← Uses YouTube output
- BAD: "body": "{{ input.body }}" ← Blind placeholder when YouTube data is available

## GENERATION WORKFLOW (DETAILED STEPS):

### Step 1: Choose Trigger
\`\`\`
use choose_trigger with the user prompt
→ returns { trigger: "chat"|"manual"|"webhook", reason: "..." }
This determines the first node of the workflow
\`\`\`

### Step 2: Extract Intent & List Operations
\`\`\`
use extract_intent with user prompt
→ returns { platforms, ... }

For EACH platform needed:
  use list_all_operations with the platform name
  → returns ALL available operations, their resources, and descriptions
  MATCH user intent to the EXACT operation names found. DO NOT hallucinate.
\`\`\`

### Step 3: Get Operation Schema & Data Flow & ASSEMBLE CONFIG
\`\`\`
For EACH operation:
  a. use get_operation_schema with {platform, operation}
     → returns { operation (canonical), resource, inputs: [...] }

  b. use get_operation_outputs with {platform, operation}  ← NEW!
     → returns what this operation produces

  c. For operations AFTER the trigger:
     - use validate_data_flow to check compatibility with previous outputs
     - use resolve_dynamic_references to intelligently map previous outputs to current inputs

  d. use assemble_node_config with:
     {
       platform,
       operation: canonical_op,
       resource: inferred_resource,
       operationSchema: schema_inputs,
       staticFields,
       dynamicFields,
       resolvedFields (from resolve_dynamic_references)  ← NEW!
     }

Returns: { config: { ... }, resource }
\`\`\`

Example: User says "send email to john@example.com with message from chat"
\`\`\`
extract_intent returns:
{
  platform: "Gmail",
  suggestedOperations: ["send"],
  staticFields: { to: "john@example.com" },
  dynamicFields: { body: "message" }
}

get_operation_schema("Gmail", "send") returns:
{
  operation: "send",
  inputs: [
    { key: "to", required: true, ... },
    { key: "subject", required: true, ... },
    { key: "body", required: false, ... }
  ]
}

Now BUILD the config:
{
  operation: "send",
  to: "john@example.com",  ← from staticFields
  subject: "{{ input.subject }}",  ← required but not in prompt, use dynamic
  body: "{{ input.message }}"  ← from dynamicFields mapping
}
\`\`\`

### Step 4: Call build_nodes with Complete Configs
\`\`\`
use build_nodes with:
{
  nodes: [
    {
      type: "trigger",
      trigger: "chat"|"manual"|"webhook",
      config: { responseMode: "When execution is finished" },
      id: "trigger-chat",
      position: { x: 0, y: 0 }
    },
    {
      type: "platform",
      platform: "Gmail",          ← CRITICAL: Must include platform name
      operation: "send",          ← CRITICAL: Must include operation name
      config: {
        operation: "send",
        to: "john@example.com",
        subject: "{{ input.subject }}",
        body: "{{ input.message }}"
      },
      id: "gmail-1",
      position: { x: 200, y: 0 }
    }
  ]
}

⚠️ CRITICAL REQUIREMENTS for build_nodes:
- EVERY platform node MUST have: type, platform, operation, config, id, position
- platform field MUST match the actual platform name (YouTube, Gmail, GitHub, etc.)
- operation field MUST match the operation being performed
- config MUST contain all required fields from assemble_node_config result
- If platform or operation are missing/empty, the workflow will FAIL with "Unknown operation" error

build_nodes will VALIDATE:
- All required fields are present in config
- Operation exists for the platform
- Return complete node objects or error if missing fields
\`\`\`

### Step 5: Build Edges (Connections)
\`\`\`
Create edges to connect nodes:
- Trigger → First action node
- Action node → Next action node (if multiple actions)

Example:
edges: [
  {
    id: "edge-1",
    source: "trigger-chat",
    sourceHandle: "output",
    target: "gmail-1",
    targetHandle: "input"
  }
]
\`\`\`

### Step 6: Build Workflow & Return
\`\`\`
use build_workflow with:
{
  name: "Workflow Name",
  description: "What it does",
  nodes: [trigger node, action nodes],
  edges: [connections]
}

Return ONLY the JSON output
\`\`\`

## COMPLETE EXAMPLE WORKFLOW:

User prompt: "Create a chat workflow that sends emails to users who message"

Result:
\`\`\`json
{
  "name": "Email on Chat Message",
  "description": "Sends an email whenever someone messages the chat",
  "nodes": [
    {
      "id": "trigger-chat",
      "label": "When chat message received",
      "data": { "responseMode": "When execution is finished" },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "gmail-1",
      "label": "Gmail",
      "data": {
        "operation": "send",
        "to": "{{ input.email }}",
        "subject": "Message Received",
        "body": "You sent: {{ input.message }}"
      },
      "position": { "x": 200, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "trigger-chat",
      "sourceHandle": "output",
      "target": "gmail-1",
      "targetHandle": "input"
    }
  ]
}
\`\`\`

## THE CONFIG BUILDING ALGORITHM (KEY STEP):

This is what assembles node.data - DO NOT SKIP:

\`\`\`
For each platform node needed:
  1. Get operation schema: what inputs does this operation need?
  2. For EACH input in the schema:
     a. Check: is this in staticFields (literal value from prompt)? → use it
     b. Check: is this in dynamicFields (from user input)? → use {{ input.fieldName }}
     c. Check: is this REQUIRED and not provided? → use {{ input.fieldName }}
     d. Check: is this OPTIONAL? → skip it (unless default makes sense)
  3. Assemble: config = { operation: "...", field1: value, field2: "{{ input.name }}", ... }
  4. Call build_nodes with this complete config
\`\`\`

Example walkthrough:
\`\`\`
Prompt: "Get YouTube channel stats and email them to me weekly"

Step 1: extract_intent
→ { platforms: ["YouTube", "Gmail"],
    primaryOperation: "send",
    staticFields: {},
    dynamicFields: {email: "userEmail", stats: "stats"} }

Step 2: For YouTube - get_operation_schema("YouTube", "getChannelStats")
→ { inputs: [{key: "channelId", required: true}] }

Step 3: For YouTube - get_operation_outputs("YouTube", "getChannelStats")  ← NEW!
→ { outputs: [
    {key: "views", type: "number"},
    {key: "subscribers", type: "number"},
    {key: "title", type: "string"},
    {key: "videoCount", type: "number"}
  ] }

Step 4: For Gmail - get_operation_schema("Gmail", "send")
→ { inputs: [
    {key: "to", required: true},
    {key: "subject", required: true},
    {key: "body", required: true}
  ] }

Step 5: For Gmail - validate_data_flow & resolve_dynamic_references  ← NEW!
→ Can YouTube outputs work with Gmail inputs?
   validate_data_flow: YouTube.views → Gmail.body? YES ✓
→ resolve_dynamic_references returns:
   {
     to: "{{ input.userEmail }}",
     subject: "Weekly YouTube Stats",
     body: "Your channel has {{ nodes.youtube-1.views }} views and {{ nodes.youtube-1.subscribers }} subscribers"
   }

Step 6: Build configs:
  YouTube: {operation: "getChannelStats", channelId: "{{ input.channelId }}"}
  Gmail: {operation: "send", to: "{{ input.userEmail }}", subject: "Weekly YouTube Stats", body: "...{{ nodes.youtube-1.views }}..."}

Step 7: Call build_nodes with proper structure:
\`\`\`
build_nodes({
  "nodes": [
    {
      "type": "trigger",
      "trigger": "manual",
      "config": {},
      "id": "trigger-manual",
      "position": { "x": 0, "y": 0 }
    },
    {
      "type": "platform",
      "platform": "YouTube",
      "operation": "getChannelStats",
      "config": {
        "operation": "getChannelStats",
        "channelId": "{{ input.channelId }}"
      },
      "id": "youtube-1",
      "position": { "x": 200, "y": 0 }
    },
    {
      "type": "platform",
      "platform": "Gmail",
      "operation": "send",
      "config": {
        "operation": "send",
        "to": "{{ input.userEmail }}",
        "subject": "Weekly YouTube Stats",
        "body": "Your channel has {{ nodes.youtube-1.views }} views and {{ nodes.youtube-1.subscribers }} subscribers"
      },
      "id": "gmail-1",
      "position": { "x": 400, "y": 0 }
    }
  ]
})
\`\`\`
→ Returns complete nodes with proper structure
\`\`\`

## CRITICAL: PREVENTING EMPTY PLATFORM/OPERATION ERRORS

⚠️ ERROR PREVENTION: If workflow fails with "[YouTube Error] Unknown YouTube operation:" (empty operation)
    This means build_nodes was called with missing or empty platform/operation fields.

    SOLUTION: When calling build_nodes:
    1. For EACH platform, extract the operation from extract_intent or from your reasoning
    2. Pass BOTH platform AND operation to build_nodes
    3. Verify platform names match exactly: YouTube, Gmail, GitHub, Slack, Linear, Notion, Drive, Sheets, Calendar, Supabase
    4. Never call build_nodes with undefined platform or operation

Example of CORRECT build_nodes call:
{
  "nodes": [
    { "type": "trigger", "trigger": "manual", ... },
    { "type": "platform", "platform": "YouTube", "operation": "getChannelStats", "config": {...}, ... },
    { "type": "platform", "platform": "Gmail", "operation": "send", "config": {...}, ... }
  ]
}

Example of WRONG build_nodes call (would fail):
{
  "nodes": [
    { "type": "platform", "platform": "", "operation": "", "config": {...}, ... }  ← EMPTY - WILL FAIL
  ]
}

## REQUIRED CHECKLIST:
✅ Always choose_trigger first
✅ Always extract_intent to find staticFields and dynamicFields
✅ Always get_operation_schema for each operation
✅ For operations AFTER trigger: Call get_operation_outputs (NEW!)
✅ For operations AFTER trigger: Call validate_data_flow (NEW!)
✅ For operations AFTER trigger: Call resolve_dynamic_references (NEW!)
✅ Always BUILD CONFIG using the algorithm above (don't skip this!)
✅ Always use resolved fields from resolve_dynamic_references
✅ Prefer node outputs over user input placeholders: {{ nodes.X.Y }} not {{ input.X }}
✅ Always pass complete config to build_nodes (operation + all fields)
✅ CRITICAL: All platform nodes MUST have non-empty platform and operation fields
✅ First node is ALWAYS a trigger (Chat/Manual/Webhook)
✅ All connector nodes have operation field set
✅ All required fields filled with literal, {{ input.field }}, or {{ nodes.X.Y }}
✅ Edges connect nodes in order
✅ No empty nodes, no missing required fields

RETURN ONLY VALID JSON - no explanations, no markdown.`;

    const userMessage = `Generate a COMPLETE EXECUTABLE workflow for: ${prompt}

🚀 CORE PIPELINE (YOU MUST FOLLOW THESE STEPS IN ORDER):
1. **Trigger Calculation**: Call 'choose_trigger' to determine the correct entry point.
2. **Intent Analysis**: Call 'extract_intent' to find platforms and static/dynamic fields.
3. **Operations Discovery**: For EACH platform, call 'list_all_operations' to find the EXACT keys.
4. **Schema Retrieval**: Call 'get_operation_schema' for each operation to see REQUIRED fields.
5. **Output Discovery** (NEW!): Call 'get_operation_outputs' to see what data each operation produces.
6. **Data Flow Validation** (NEW!): Call 'validate_data_flow' to ensure outputs work with downstream inputs.
7. **Reference Resolution** (NEW!): Call 'resolve_dynamic_references' to intelligently map outputs to inputs.
8. **Node Construction**: Call 'build_nodes' with ALL assembled node specs (using resolved references).
9. **Finalization**: Call 'build_workflow' to return the final JSON.

⚠️ WARNING: DO NOT simply output a JSON block. You MUST call the tools. Your response will only be complete once you call 'build_workflow'.`;

    // Initialize conversation messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Agent loop - keep going until we get a final response
    let maxIterations = 15;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`[Architect] Iteration ${iteration}`);

      // Call the model
      const response = await modelWithTools.invoke(messages);

      // Check if the response has tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`[Architect] Tool calls:`, response.tool_calls.map((t: any) => t.name));

        // Add the assistant response to the message history
        messages.push({
          role: 'assistant',
          content: response.content || '',
          tool_calls: response.tool_calls,
        });

        // Execute each tool call and add results as separate messages
        for (const toolCall of response.tool_calls) {
          console.log(`[Architect] Executing tool: ${toolCall.name}`, JSON.stringify(toolCall.args));
          const result = await executeTool(toolCall.name, toolCall.args);
          console.log(`[Architect] Tool result: ${result.substring(0, 200)}`);

          // Add tool result as a user message with clear formatting
          messages.push({
            role: 'user',
            content: `Tool ${toolCall.name} result: ${result}`,
          });
        }
      } else {
        // No tool calls - we have a final text response.
        const responseText = String(response.content || '');

        // 1. Check if model finally called build_workflow
        const buildWorkflowResult = [...messages].reverse().find(m => m.role === 'user' && m.content.includes('Tool build_workflow result:'));
        if (buildWorkflowResult) {
            try {
                const jsonStr = buildWorkflowResult.content.split('Tool build_workflow result: ')[1];
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error('[Architect] Failed to parse build_workflow result:', e);
            }
        }

        // 2. Fallback: Salvage if build_nodes was called but workflow wasn't finalized
        const buildNodesResult = [...messages].reverse().find(m => m.role === 'user' && m.content.includes('Tool build_nodes result:'));
        if (buildNodesResult) {
            try {
                const jsonStr = buildNodesResult.content.split('Tool build_nodes result: ')[1];
                const resNode = JSON.parse(jsonStr);
                return {
                    name: 'Workflow Generated',
                    description: 'Generated from your request',
                    nodes: resNode.nodes || [],
                    edges: [] 
                };
            } catch (e) {
                console.error('[Architect] Failed to parse build_nodes result fallback:', e);
            }
        }

        if (iteration === 1) {
            messages.push({ role: 'assistant', content: responseText });
            messages.push({ role: 'user', content: "Please follow the tool pipeline. Start by calling 'choose_trigger' and 'extract_intent' to begin properly." });
            continue;
        }

        console.log(`[Architect] Agent finished with text (no tool result/workflow):`, responseText.substring(0, 500));
        break;
      }
    }

    // Fallback: return a basic structure
    return {
      name: 'Generated Workflow',
      description: 'Workflow generated from your request',
      nodes: [],
      edges: [],
      explanation: 'Could not auto-generate. Please configure nodes manually.',
    };
  } catch (err: any) {
    console.error('[Architect] Error:', err.message);
    throw new Error(
      `Architect failed: ${err.message || 'Unknown error'}. Please try again.`
    );
  }
}
