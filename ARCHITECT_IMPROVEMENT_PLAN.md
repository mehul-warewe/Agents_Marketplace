# Architect Enhancement Plan: Smart Data Flow

## 🎯 Problem Statement

Current architect generates workflows **blindly**:
- Doesn't know what data nodes output
- Can't map outputs to inputs intelligently
- Uses placeholder `{{ input.X }}` without validation
- No type compatibility checking

**Result:** Users must manually fix data mappings after generation

## ✅ Solution Overview

Add **3 new architect tools** + **output schemas to all nodes** to enable intelligent data flow mapping.

---

## 📐 Phase 1: Add Output Schemas to Node Definitions

### Current Node Structure (incomplete)
```typescript
// packages/nodes/src/definitions/youtube/youtube.ts
export const youtubeNode = {
  id: 'youtube',
  label: 'YouTube',
  description: 'YouTube integration',
  operationInputs: {
    getChannelStats: [
      { key: 'channelId', required: true, type: 'string' }
    ]
  },
  // ❌ MISSING: operationOutputs
}
```

### Enhanced Node Structure (complete)
```typescript
export const youtubeNode = {
  id: 'youtube',
  label: 'YouTube',
  description: 'YouTube integration',
  operationInputs: {
    getChannelStats: [
      { key: 'channelId', required: true, type: 'string', description: 'Channel ID' }
    ],
    searchVideos: [
      { key: 'query', required: true, type: 'string', description: 'Search query' },
      { key: 'maxResults', required: false, type: 'number', description: 'Max results' }
    ]
  },
  // ✅ NEW: operationOutputs
  operationOutputs: {
    getChannelStats: [
      { key: 'channelId', type: 'string', description: 'The channel ID' },
      { key: 'title', type: 'string', description: 'Channel title' },
      { key: 'views', type: 'number', description: 'Total views' },
      { key: 'subscribers', type: 'number', description: 'Subscriber count' },
      { key: 'videoCount', type: 'number', description: 'Number of videos' },
      { key: 'description', type: 'string', description: 'Channel description' },
      { key: 'url', type: 'string', description: 'Channel URL' }
    ],
    searchVideos: [
      { key: 'results', type: 'array', description: 'Array of video results' },
      { key: 'videos', type: 'array', items: {
        videoId: 'string',
        title: 'string',
        views: 'number',
        uploadDate: 'string',
        url: 'string'
      } }
    ]
  }
}
```

### Files to Update

All node definitions in `packages/nodes/src/definitions/`:
```
├── youtube/youtube.ts                  ← Add operationOutputs
├── gmail/gmail.ts                      ← Add operationOutputs
├── github/github.ts                    ← Add operationOutputs
├── slack/slack.ts                      ← Add operationOutputs
├── drive/drive.ts                      ← Add operationOutputs
├── sheets/sheets.ts                    ← Add operationOutputs
├── linear/linear.ts                    ← Add operationOutputs
├── notion/notion.ts                    ← Add operationOutputs
├── calendar/calendar.ts                ← Add operationOutputs
├── supabase/supabase.ts                ← Add operationOutputs
└── manual-trigger/manual-trigger.ts    ← Add operationOutputs
    (triggers have outputs like { message, input, body, query, headers })
```

### Example: Gmail Node
```typescript
operationOutputs: {
  send: [
    { key: 'messageId', type: 'string', description: 'ID of sent message' },
    { key: 'status', type: 'string', description: 'Status: "sent"' },
    { key: 'timestamp', type: 'string', description: 'Send timestamp' }
  ],
  search: [
    { key: 'messages', type: 'array', description: 'Array of messages' },
    { key: 'count', type: 'number', description: 'Total count' },
    { key: 'threads', type: 'array', description: 'Thread objects' }
  ],
  reply: [
    { key: 'messageId', type: 'string', description: 'ID of reply message' },
    { key: 'status', type: 'string', description: 'Status: "sent"' }
  ]
}
```

### Example: Chat Trigger
```typescript
operationOutputs: {
  default: [  // Triggers don't have "operations" but we use "default"
    { key: 'message', type: 'string', description: 'Chat message text' },
    { key: 'input', type: 'string', description: 'Same as message' },
    { key: 'userId', type: 'string', description: 'User ID from chat' },
    { key: 'timestamp', type: 'string', description: 'Message timestamp' }
  ]
}
```

---

## 🔧 Phase 2: Add New Architect Tools

### Tool 1: `get_operation_outputs`

**File:** `apps/api/src/architect-tools.ts` (add after `getOperationSchemaTool`)

```typescript
export const getOperationOutputsTool = new DynamicTool({
  name: 'get_operation_outputs',
  description:
    'Get output schema for a specific operation. Pass JSON: {platform, operation}. Returns what data this operation produces.',
  func: async (input: string) => {
    try {
      let platform, operation;

      if (input.startsWith('{')) {
        const parsed = JSON.parse(input);
        platform = parsed.platform;
        operation = parsed.operation;
      } else {
        const parts = input.split(',').map((s) => s.trim());
        platform = parts[0];
        operation = parts[1];
      }

      if (!platform || !operation) {
        return JSON.stringify({
          error: 'Invalid input format. Use: {platform, operation}',
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

      // Handle triggers specially - they use "default" key
      const opKey = node.isTrigger ? 'default' : operation;
      const outputs = node.operationOutputs?.[opKey];

      if (!outputs) {
        return JSON.stringify({
          error: `No output schema found for ${operation}`,
          available: Object.keys(node.operationOutputs || {}),
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
```

### Tool 2: `validate_data_flow`

**File:** `apps/api/src/architect-tools.ts` (add after `getOperationOutputsTool`)

```typescript
export const validateDataFlowTool = new DynamicTool({
  name: 'validate_data_flow',
  description:
    'Validate if output from one node can connect to input of another. Pass JSON: {sourceOp, sourceOperation, targetOp, targetOperation, targetInput}',
  func: async (input: string) => {
    try {
      const data = JSON.parse(input.startsWith('{') ? input : JSON.stringify({}));
      const { sourcePlatform, sourceOperation, targetPlatform, targetOperation, targetInput } = data;

      if (!sourcePlatform || !sourceOperation || !targetPlatform || !targetOperation || !targetInput) {
        return JSON.stringify({
          error: 'Missing required fields: sourcePlatform, sourceOperation, targetPlatform, targetOperation, targetInput',
        });
      }

      // Get source node outputs
      const sourceNode = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === sourcePlatform.toLowerCase()
      );
      const sourceOpKey = sourceNode?.isTrigger ? 'default' : sourceOperation;
      const sourceOutputs = sourceNode?.operationOutputs?.[sourceOpKey] || [];

      // Get target node inputs
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
          error: `Input "${targetInput}" not found in ${targetOperation}`,
          availableInputs: targetInputs.map((i: any) => i.key),
        });
      }

      // Find compatible outputs
      const compatibleOutputs = sourceOutputs.filter((o: any) => {
        const sourceType = o.type || 'string';
        const targetType = targetInputDef.type || 'string';

        // Type compatibility rules
        if (sourceType === targetType) return true;
        if (sourceType === 'number' && targetType === 'string') return true; // can convert
        if (sourceType === 'string' && ['array', 'object'].includes(targetType)) return false;
        if (sourceType === 'array' && targetType === 'string') return true; // can stringify
        return false;
      });

      return JSON.stringify({
        valid: compatibleOutputs.length > 0,
        compatibleOutputs: compatibleOutputs.map((o: any) => o.key),
        bestMatch: compatibleOutputs[0]?.key || null,
        targetInput,
        targetType: targetInputDef.type,
        recommendation: compatibleOutputs.length > 0
          ? `Use {{ nodes.<source-id>.${compatibleOutputs[0]?.key} }} for the ${targetInput} input`
          : 'No compatible outputs found. User input required.',
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});
```

### Tool 3: `resolve_dynamic_references`

**File:** `apps/api/src/architect-tools.ts` (add after `validateDataFlowTool`)

```typescript
export const resolveDynamicReferencesTool = new DynamicTool({
  name: 'resolve_dynamic_references',
  description:
    'Intelligently map node outputs to input fields. Knows what each node produces and finds the best match for each input.',
  func: async (input: string) => {
    try {
      const data = JSON.parse(input);
      const { targetOperation, targetPlatform, targetInputs, availableNodes } = data;
      // availableNodes = [{ id: "youtube-1", platform: "YouTube", operation: "getChannelStats" }, ...]

      if (!targetOperation || !targetPlatform || !Array.isArray(availableNodes)) {
        return JSON.stringify({
          error: 'Missing: targetOperation, targetPlatform, or availableNodes',
        });
      }

      const targetNode = NODE_REGISTRY.find(
        (n) => n.label.toLowerCase() === targetPlatform.toLowerCase()
      );
      const targetInputDefs = targetNode?.operationInputs?.[targetOperation] || [];

      const resolvedFields: any = {};
      const unresolvedInputs: string[] = [];

      // For each required input of the target operation
      for (const inputDef of targetInputDefs.filter((i: any) => i.required)) {
        const inputKey = inputDef.key;

        // Try to find a matching output from available nodes
        let found = false;

        for (const availableNode of availableNodes) {
          const opKey = NODE_REGISTRY.find(
            (n) => n.label.toLowerCase() === availableNode.platform.toLowerCase()
          )?.isTrigger ? 'default' : availableNode.operation;

          const sourceNode = NODE_REGISTRY.find(
            (n) => n.label.toLowerCase() === availableNode.platform.toLowerCase()
          );
          const sourceOutputs = sourceNode?.operationOutputs?.[opKey] || [];

          // Look for exact key match or semantic match
          const exactMatch = sourceOutputs.find(
            (o: any) => o.key.toLowerCase() === inputKey.toLowerCase()
          );
          const semanticMatch = sourceOutputs.find((o: any) =>
            inputKey.toLowerCase().includes(o.key.toLowerCase()) ||
            o.key.toLowerCase().includes(inputKey.toLowerCase())
          );

          const match = exactMatch || semanticMatch;
          if (match) {
            resolvedFields[inputKey] = `{{ nodes.${availableNode.id}.${match.key} }}`;
            found = true;
            break;
          }
        }

        if (!found) {
          unresolvedInputs.push(inputKey);
          resolvedFields[inputKey] = `{{ input.${inputKey} }}`; // Fallback to user input
        }
      }

      return JSON.stringify({
        resolvedFields,
        unresolvedInputs,
        status: unresolvedInputs.length === 0 ? 'All inputs resolved from node outputs' : `${unresolvedInputs.length} inputs require user input`,
        nodeReferences: availableNodes.map((n: any) => ({
          id: n.id,
          platform: n.platform,
          operation: n.operation,
        })),
      });
    } catch (err) {
      return JSON.stringify({ error: String(err) });
    }
  },
});
```

### Update Tools Array

```typescript
// architect-tools.ts line 716-724
export const allArchitectTools = [
  chooseTriggerTool,
  extractIntentTool,
  listOperationsTool,
  getOperationSchemaTool,
  getOperationOutputsTool,           // ← NEW
  validateDataFlowTool,              // ← NEW
  resolveDynamicReferencesTool,      // ← NEW
  assembleNodeConfigTool,
  buildNodesTool,
  buildWorkflowTool,
];
```

---

## 📝 Phase 3: Update Architect System Prompt

**File:** `apps/api/src/architect-agent.ts` (lines 53-342)

### Add to Section: "## AVAILABLE TRIGGERS"

```
Output data from triggers:
- Chat Trigger: {{ input.message }}, {{ input.input }} - user's chat message
- Manual Trigger: No input data (user provides via test input)
- Webhook Trigger: {{ input.body }}, {{ input.query }}, {{ input.headers }}
```

### Add New Section: "## DATA FLOW MAPPING"

```
### Understanding Node Outputs

EVERY operation produces outputs that can be used in downstream nodes:

Gmail.send outputs:
- {{ nodes.gmail-1.messageId }} - ID of sent message
- {{ nodes.gmail-1.status }} - Status: "sent"

YouTube.getChannelStats outputs:
- {{ nodes.youtube-1.views }} - Total views (number)
- {{ nodes.youtube-1.subscribers }} - Subscriber count
- {{ nodes.youtube-1.title }} - Channel title
- {{ nodes.youtube-1.videoCount }} - Video count

GitHub.listIssues outputs:
- {{ nodes.github-1.issues }} - Array of issue objects
- {{ nodes.github-1.count }} - Total issue count

### Smart Data Mapping Strategy

ALWAYS use outputs from previous nodes when available:
- "send the stats found by YouTube" → "body": "Stats: {{ nodes.youtube-1.views }} views"
- "email the list of GitHub issues" → "body": "Issues: {{ nodes.github-1.issues }}"

Only use {{ input.X }} when data comes from the trigger or user input.

### Step-by-Step Data Flow Process

1. After build_nodes is called, you have the complete node sequence
2. For EACH node after the trigger:
   a. Call get_operation_outputs for ALL previous nodes
   b. Call validate_data_flow to check if outputs are compatible with inputs
   c. Call resolve_dynamic_references to intelligently map outputs to inputs
   d. Update the node's config with ACTUAL node references, not placeholders

Example workflow:

Nodes generated:
1. trigger-chat (outputs: message, input, userId)
2. youtube-1 (getChannelStats) → needs: channelId
3. gmail-1 (send) → needs: to, subject, body

Process:
Step 1: Before youtube-1
  - get_operation_outputs(YouTube, getChannelStats)
    returns: [views, subscribers, title, videoCount, description, url]
  - validate_data_flow(chat trigger, youtube-1, channelId)
    → No match, need user input
  - youtube-1 config: { operation: "getChannelStats", channelId: "{{ input.channelId }}" }

Step 2: Before gmail-1
  - get_operation_outputs(YouTube, getChannelStats)
    returns: [views, subscribers, title, videoCount, description, url]
  - validate_data_flow(youtube-1, gmail-1, body)
    → Found match: "subscribers" is compatible with "body" (number→string)
  - resolve_dynamic_references({
      targetOperation: "send",
      targetPlatform: "Gmail",
      availableNodes: [
        { id: "trigger-chat", platform: "Chat Trigger", operation: "default" },
        { id: "youtube-1", platform: "YouTube", operation: "getChannelStats" }
      ]
    })
    returns: {
      to: "{{ input.recipientEmail }}",      ← From user input
      subject: "Weekly Report",
      body: "Views: {{ nodes.youtube-1.views }}, Subs: {{ nodes.youtube-1.subscribers }}"  ← From YouTube
    }
  - gmail-1 config: above resolved values

CRITICAL: Always call resolve_dynamic_references BEFORE build_nodes to ensure
configs use actual node outputs, not blind placeholders!
```

### Update Iteration Instructions

```
### ENHANCED GENERATION WORKFLOW:

### Step 3: Get Operation Schema & ASSEMBLE CONFIG
→ For EACH operation:
  a. use get_operation_schema
  b. use get_operation_outputs for THIS operation (what it produces)
  c. use get_operation_outputs for ALL PREVIOUS operations (what data is available)
  d. use validate_data_flow (can outputs from previous nodes work with this node?)
  e. use resolve_dynamic_references (smartly map outputs to inputs)
  f. use assemble_node_config with the resolved mappings
```

---

## 💻 Phase 4: Update Node Configuration Logic

### Update `assemble_node_config` in architect-tools.ts

**OLD (lines 360-422):**
```typescript
// Just fills with {{ input.X }} placeholders
```

**NEW:**
```typescript
export const assembleNodeConfigTool = new DynamicTool({
  name: 'assemble_node_config',
  description: 'Builds complete node config. Now includes intelligent data flow mapping.',
  func: async (input: string) => {
    try {
      let data;
      if (input.startsWith('{')) {
        data = JSON.parse(input);
      } else {
        return JSON.stringify({ error: 'Input must be JSON' });
      }

      const {
        platform,
        operation,
        operationSchema,
        staticFields = {},
        dynamicFields = {},
        resolvedFields = {},  // ← NEW: Pre-resolved outputs
        previousNodeOutputs = {}  // ← NEW: Available outputs from previous nodes
      } = data;

      if (!platform || !operation || !operationSchema) {
        return JSON.stringify({ error: 'Missing required fields' });
      }

      const inputs = Array.isArray(operationSchema)
        ? operationSchema
        : (operationSchema.inputs || []);

      const config: any = { operation };
      const missingRequired: string[] = [];

      for (const inputDef of inputs) {
        const { key, required } = inputDef;

        // Priority 1: Pre-resolved outputs (from resolve_dynamic_references)
        if (key in resolvedFields) {
          config[key] = resolvedFields[key];
          continue;
        }

        // Priority 2: Static fields (literals from prompt)
        if (key in staticFields) {
          config[key] = staticFields[key];
          continue;
        }

        // Priority 3: Dynamic fields (from trigger input)
        if (key in dynamicFields) {
          const inputName = dynamicFields[key];
          config[key] = `{{ input.${inputName} }}`;
          continue;
        }

        // Priority 4: Try to find in previous node outputs
        for (const [nodeId, outputs] of Object.entries(previousNodeOutputs)) {
          const match = (outputs as any[]).find(
            (o: any) => o.key.toLowerCase() === key.toLowerCase()
          );
          if (match) {
            config[key] = `{{ nodes.${nodeId}.${match.key} }}`;
            continue;
          }
        }

        // Priority 5: Fallback to required input placeholder
        if (required) {
          config[key] = `{{ input.${key} }}`;
          missingRequired.push(key);
        }
      }

      return JSON.stringify({
        config,
        missingRequired,
        status: missingRequired.length > 0
          ? 'Config with user input placeholders for missing required fields'
          : 'Config complete with intelligent node output mapping',
      });
    } catch (err: any) {
      return JSON.stringify({ error: String(err) });
    }
  },
});
```

---

## 📋 Phase 5: Implementation Steps

### Step 1: Add Output Schemas
- [ ] Update all 10+ node definitions with `operationOutputs`
- [ ] Test that NODE_REGISTRY includes output schemas
- [ ] Verify trigger outputs are defined

### Step 2: Create New Tools
- [ ] Add `getOperationOutputsTool` to architect-tools.ts
- [ ] Add `validateDataFlowTool` to architect-tools.ts
- [ ] Add `resolveDynamicReferencesTool` to architect-tools.ts
- [ ] Update `allArchitectTools` array
- [ ] Test each tool individually

### Step 3: Update System Prompt
- [ ] Add "DATA FLOW MAPPING" section to system prompt
- [ ] Update generation workflow steps
- [ ] Add detailed examples
- [ ] Update required checklist

### Step 4: Update Node Config Logic
- [ ] Modify `assembleNodeConfigTool` to use new priorities
- [ ] Pass `resolvedFields` to build_nodes
- [ ] Test config assembly

### Step 5: Test End-to-End
- [ ] Test architect with: "Send YouTube stats via email"
- [ ] Verify outputs are mapped: `{{ nodes.youtube-1.views }}` not `{{ input.views }}`
- [ ] Test with multi-step workflows
- [ ] Verify data type compatibility checking

---

## 🧪 Testing Strategy

### Test Case 1: YouTube → Email Workflow
**Prompt:** "Build a workflow that gets YouTube channel stats and emails me a report"

**Expected Output:**
```json
{
  "gmail-1": {
    "config": {
      "operation": "send",
      "to": "{{ input.userEmail }}",
      "subject": "Weekly YouTube Report",
      "body": "Your channel has {{ nodes.youtube-1.views }} views and {{ nodes.youtube-1.subscribers }} subscribers"
    }
  }
}
```

**NOT:**
```json
{
  "gmail-1": {
    "config": {
      "to": "{{ input.recipientEmail }}",
      "subject": "{{ input.subject }}",
      "body": "{{ input.body }}"
    }
  }
}
```

### Test Case 2: GitHub Search → Slack
**Prompt:** "Search GitHub issues and post results to Slack"

**Expected Mapping:**
- GitHub.searchIssues outputs: `issues` (array), `count` (number)
- Slack.sendMessage needs: `message` (string)
- Should map: `message: "Found {{ nodes.github-1.count }} issues: {{ nodes.github-1.issues }}"`

### Test Case 3: Type Compatibility
**Prompt:** "Get subscriber count from YouTube and send to Slack"

**Validation:**
- YouTube outputs: `subscribers` (number)
- Slack needs: `message` (string)
- Should validate: ✅ Compatible (number can convert to string)
- Output: `message: "Subscribers: {{ nodes.youtube-1.subscribers }}"`

### Test Case 4: Unresolvable References
**Prompt:** "Get a list of repos and email the owner names"

**Result:**
- GitHub.listRepos outputs: `repos` (array with repo objects)
- Gmail.send needs: `to` (string - email)
- Should recognize: ❌ Can't map array to email address
- Output: `to: "{{ input.recipientEmail }}"` (fallback to user input)

---

## 🚀 Expected Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Data Mapping** | Blind placeholders `{{ input.X }}` | Smart `{{ nodes.X.output }}` references |
| **Output Knowledge** | None | Complete output schema for every operation |
| **Type Validation** | None | Check compatibility between connected nodes |
| **User Experience** | Manual fixes needed | 80% workflows work immediately |
| **Error Prevention** | Workflows fail at runtime | Validation at generation time |
| **Complexity Handling** | Single-step workflows | Multi-step with proper data flow |

---

## 📊 Architecture Diagram: Before vs After

### BEFORE: Blind Generation
```
Prompt: "Get YouTube stats and email them"
        ↓
Trigger (chat)
        ↓
YouTube.getChannelStats
  config: { channelId: "{{ input.channelId }}" }
        ↓
Gmail.send
  config: {
    to: "{{ input.to }}",           ← No idea if this exists!
    body: "{{ input.body }}"         ← Should use YouTube output!
  }
❌ User must fix: body: "{{ nodes.youtube-1.views }}"
```

### AFTER: Intelligent Generation
```
Prompt: "Get YouTube stats and email them"
        ↓
Tool: get_operation_outputs(YouTube, getChannelStats)
Result: [views, subscribers, title, videoCount, ...]
        ↓
Tool: validate_data_flow(YouTube→Gmail.send, body)
Result: ✅ Compatible (can use views/subscribers/title)
        ↓
Tool: resolve_dynamic_references(gmail-1, [youtube-1])
Result: { body: "{{ nodes.youtube-1.views }}" }
        ↓
Trigger (chat)
        ↓
YouTube.getChannelStats
  config: { channelId: "{{ input.channelId }}" }
        ↓
Gmail.send
  config: {
    to: "{{ input.userEmail }}",
    body: "Your stats: {{ nodes.youtube-1.views }} views"  ← ✅ Correct!
  }
✅ Workflow ready to use immediately
```

---

## 🎯 Success Metrics

1. **Output Schema Coverage**: 100% of operations have defined outputs
2. **Intelligent Mapping**: 80%+ of workflows use `{{ nodes.X.Y }}` not `{{ input.X }}`
3. **Reduced User Fixes**: 70% fewer manual config adjustments needed
4. **Data Flow Validation**: 100% of generated workflows have validated connections
5. **User Satisfaction**: Workflows work as-is without manual intervention

---

## ⚠️ Edge Cases to Handle

1. **Optional Inputs**: If input is optional and no output available, skip it
2. **Array Outputs**: Can array outputs be stringified for text inputs?
3. **Nested Objects**: How to reference properties in nested objects?
4. **Conditional Flows**: What if output exists only sometimes?
5. **Type Conversion**: When is numeric→string conversion safe?

---

## 📌 Code Organization

```
apps/api/src/
├── architect-agent.ts          ← Update system prompt
├── architect-tools.ts          ← Add 3 new tools
└── (no changes to agents.ts)

packages/nodes/src/definitions/
├── youtube/youtube.ts          ← Add operationOutputs
├── gmail/gmail.ts              ← Add operationOutputs
├── github/github.ts            ← Add operationOutputs
├── slack/slack.ts              ← Add operationOutputs
├── drive/drive.ts              ← Add operationOutputs
├── sheets/sheets.ts            ← Add operationOutputs
├── linear/linear.ts            ← Add operationOutputs
├── notion/notion.ts            ← Add operationOutputs
├── calendar/calendar.ts        ← Add operationOutputs
├── supabase/supabase.ts        ← Add operationOutputs
└── (triggers)
    ├── manual-trigger.ts       ← Add operationOutputs
    ├── chat-trigger.ts         ← Add operationOutputs (if exists)
    └── webhook-trigger.ts      ← Add operationOutputs (if exists)
```

---

## 💡 Implementation Priority

### Must Have (MVP)
1. Add output schemas to 3 most-used nodes (YouTube, Gmail, GitHub)
2. Create `get_operation_outputs` tool
3. Update system prompt with data flow section
4. Test with YouTube → Email workflow

### Should Have (Phase 2)
1. Add output schemas to remaining nodes
2. Create `validate_data_flow` tool
3. Create `resolve_dynamic_references` tool
4. Update `assembleNodeConfigTool` with new priorities

### Nice to Have (Phase 3)
1. Type compatibility matrix for auto-conversion
2. Visual data flow diagram in UI
3. Architect hints for incomplete workflows
4. Performance optimization for tool calls

