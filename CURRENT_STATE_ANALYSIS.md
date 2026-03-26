# Current State Analysis: Output Schemas in Nodes

## ❓ Your Question
> "Are output formats for each node's functions currently being used? Do we have those?"

## ✅ The Answer

### SHORT ANSWER
**NO** - We currently do NOT have operation-specific output schemas defined anywhere.

---

## 📊 Current State vs Required State

### What We HAVE Now ✅

**In `packages/nodes/src/types.ts` (lines 108-111):**
```typescript
operationInputs?: Record<string, NodeInput[]>;    // ✅ Defined
outputSchema?: NodeOutput[];                       // ❌ Generic, not operation-specific
```

**In Node Definition (YouTube example):**
```typescript
operationInputs: {
  getChannelStats: [
    { key: 'channelId', required: true, type: 'string' }
  ],
  searchVideos: [
    { key: 'query', required: true, type: 'string' },
    { key: 'maxResults', required: false, type: 'string' }
  ]
  // ... MORE OPERATIONS WITH INPUTS
}

// ❌ MISSING: operationOutputs
// ❌ MISSING: What each operation produces
```

### What We NEED ❌

**Should be added to types.ts:**
```typescript
operationOutputs?: Record<string, NodeOutput[]>;  // ← NOT DEFINED
```

**Should be added to each node definition:**
```typescript
operationOutputs: {
  getChannelStats: [
    { key: 'views', type: 'number', description: 'Total views' },
    { key: 'subscribers', type: 'number', description: 'Subscriber count' },
    { key: 'title', type: 'string', description: 'Channel title' }
  ],
  searchVideos: [
    { key: 'results', type: 'array', description: 'Search results' },
    { key: 'count', type: 'number', description: 'Total count' }
  ]
}
```

---

## 🔍 Current Structure

### Type Definition Hierarchy

```
NodeDefinition (types.ts)
├─ inputs: NodeSocket[]                     ← Generic canvas inputs
├─ outputs: NodeSocket[]                    ← Generic canvas outputs
├─ operationInputs: Record<operation, inputs[]>     ✅ DEFINED
│  └─ Maps each operation to required inputs
├─ outputSchema: NodeOutput[]               ❌ GENERIC ONLY
│  └─ Single output schema for entire node (not per-operation)
└─ operationOutputs: Record<operation, outputs[]>  ❌ MISSING!
   └─ Should map each operation to its outputs
```

### Real Example: Gmail Node

**CURRENTLY DEFINED:**
```typescript
operationInputs: {
  send: [
    { key: 'to', required: true },
    { key: 'subject', required: true },
    { key: 'body', required: true }
  ],
  search: [
    { key: 'query', required: true },
    { key: 'maxResults', required: false }
  ],
  reply: [
    { key: 'messageId', required: true },
    { key: 'body', required: true }
  ]
  // ... 20+ more operations with inputs defined
}

// ❌ MISSING:
// operationOutputs: {
//   send: [{ key: 'messageId', type: 'string' }, ...],
//   search: [{ key: 'messages', type: 'array' }, ...],
//   reply: [{ key: 'messageId', type: 'string' }, ...]
// }
```

---

## 🚀 Where Output Schemas Should Be Used

### 1. **Architect Tools** (Not Using Outputs Now)

**Current architect-tools.ts:**
```typescript
// ❌ This tool EXISTS but architect NEVER CALLS IT
export const getOperationSchemaTool = new DynamicTool({
  name: 'get_operation_schema',
  func: async (input: string) => {
    // Returns: { inputs: [...] }
    // ❌ Does NOT return outputs - they don't exist!
  },
});

// ❌ MISSING: These tools don't exist
export const getOperationOutputsTool = new DynamicTool({...}); // NOT DEFINED
export const validateDataFlowTool = new DynamicTool({...});     // NOT DEFINED
```

### 2. **Architect System Prompt** (Doesn't Know About Outputs)

**Current system prompt (architect-agent.ts):**
```
Line 102-106: "From previous node output: use {{ nodes.github-1.issues }}"
             ❌ But architect doesn't know what outputs exist!
             ❌ Just a documentation example, not enforced

Line 157-164: Shows how to map values
             ❌ But doesn't explain how to discover available outputs
```

### 3. **Node Config Assembly** (Uses Blind Placeholders)

**Current assembleNodeConfigTool (architect-tools.ts:460-490):**
```typescript
// For required field not in staticFields/dynamicFields:
if (required) {
  config[key] = `{{ input.${key} }}`;  // ❌ Blind placeholder
  missingRequired.push(key);
}

// ❌ No attempt to:
// 1. Check what previous nodes output
// 2. Map outputs to this input
// 3. Use {{ nodes.X.Y }} references
```

---

## 📈 Current Architect Flow vs What's Missing

### CURRENT FLOW (What Actually Happens)

```
Iteration: get_operation_schema
├─ Architect gets: { inputs: [to, subject, body] }
├─ ❌ Architect gets: outputs = undefined (doesn't exist)
└─ Result: Only knows INPUTS, nothing about OUTPUTS

Next:
├─ assemble_node_config
├─ For each required input:
│  └─ Check staticFields? No → Check dynamicFields? No → Use {{ input.X }}
└─ Result: Blind placeholders like "body": "{{ input.body }}"
```

### WHAT SHOULD HAPPEN (With Enhancement)

```
Iteration: get_operation_outputs
├─ Architect gets: { outputs: [views, subscribers, title, ...] }
└─ Now architect KNOWS what YouTube produces

Iteration: validate_data_flow
├─ Architect checks: Can YouTube.views work with Gmail.body?
├─ Result: YES ✅ (number → string conversion OK)
└─ Now architect KNOWS compatibility

Iteration: resolve_dynamic_references
├─ Architect maps: Gmail.body should use YouTube.views
├─ Result: "body": "{{ nodes.youtube-1.views }}"
└─ Now architect generates CORRECT references
```

---

## 🎯 Usage Summary Table

| Feature | Current | Used By | Status |
|---------|---------|---------|--------|
| **operationInputs** | ✅ Defined | architect tools | ✅ Working |
| **outputSchema** | ✅ Defined (generic) | canvas display | ⚠️ Generic only |
| **operationOutputs** | ❌ Missing | (should be architect) | ❌ Not implemented |
| **get_operation_outputs** tool | ❌ Missing | (architect needs it) | ❌ Not implemented |
| **validate_data_flow** tool | ❌ Missing | (architect needs it) | ❌ Not implemented |
| **resolve_dynamic_references** tool | ❌ Missing | (architect needs it) | ❌ Not implemented |

---

## 📋 What Needs to Be Added

### Step 1: Update Type Definition
**File:** `packages/nodes/src/types.ts` (line 111)

```typescript
// ADD THIS:
operationOutputs?: Record<string, NodeOutput[]>;
```

### Step 2: Add Output Schemas to All Nodes
**Files:** All in `packages/nodes/src/definitions/*/` (each node file)

```typescript
operationOutputs: {
  operationName: [
    { key: 'outputField', type: 'string', description: '...' },
    { key: 'anotherField', type: 'number', description: '...' }
  ]
}
```

### Step 3: Add Tools to Architect
**File:** `apps/api/src/architect-tools.ts`

```typescript
// ADD:
export const getOperationOutputsTool = new DynamicTool({...});
export const validateDataFlowTool = new DynamicTool({...});
export const resolveDynamicReferencesTool = new DynamicTool({...});
```

### Step 4: Update Architect System Prompt
**File:** `apps/api/src/architect-agent.ts` (line 53-343)

```typescript
// ADD section: "## UNDERSTANDING NODE DATA FLOW"
// ADD section: "## UPDATED GENERATION PIPELINE"
```

---

## 🔧 Impact: Current vs After Enhancement

### YouTube → Gmail Workflow (Your Example)

**CURRENT BEHAVIOR:**
```
Generated config: {
  to: "{{ input.to }}",              ❌ Doesn't exist
  subject: "{{ input.subject }}",    ❌ Doesn't exist
  body: "{{ input.body }}"           ❌ Doesn't exist
}
Result: Empty/broken email ❌
```

**AFTER ENHANCEMENT:**
```
Generated config: {
  to: "{{ input.userEmail }}",
  subject: "Weekly YouTube Report",
  body: "Views: {{ nodes.youtube-1.views }}, Subs: {{ nodes.youtube-1.subscribers }}"
}
Result: Perfect email with actual stats ✅
```

---

## 📊 Coverage Analysis

### Nodes That Need Output Schemas

```
Core Integration Nodes (MUST HAVE):
├─ ✅ YouTube          (24 operations)
├─ ✅ Gmail            (24+ operations)
├─ ✅ GitHub           (20+ operations)
├─ ✅ Slack            (15+ operations)
├─ ✅ Google Drive     (12+ operations)
├─ ✅ Google Sheets    (10+ operations)
├─ ✅ Linear           (12+ operations)
├─ ✅ Notion           (8+ operations)
├─ ✅ Google Calendar  (8+ operations)
└─ ✅ Supabase         (10+ operations)

Trigger Nodes (MUST HAVE):
├─ ✅ Chat Trigger        (outputs: message, input, userId, timestamp)
├─ ✅ Manual Trigger      (outputs: none - just starts)
└─ ✅ Webhook Trigger     (outputs: body, query, headers)

Logic/AI Nodes (NICE TO HAVE):
├─ Code Node         (outputs: result)
├─ Agent Node        (outputs: result, reasoning)
└─ etc...

Total: ~12 core nodes + 3 triggers = 15 nodes minimum
```

---

## 🎯 Implementation Effort

### To Make Architect Work Correctly

| Task | Time | Complexity | Files |
|------|------|-----------|-------|
| Update types.ts | 5 min | Low | 1 |
| Add output schemas to nodes | 30 min | Low | 15 |
| Add 3 architect tools | 20 min | Medium | 1 |
| Update system prompt | 15 min | Low | 1 |
| Test end-to-end | 20 min | Low | - |
| **TOTAL** | **90 min** | **Low-Medium** | **~17** |

---

## 🚨 Why This Is Critical

Your workflow execution logs prove the gap:

```
[Iteration 8]: assemble_node_config for Gmail
Output: body: "{{ input.stats }}"
        ↑ WRONG - stats doesn't exist in input!

[Flow] Incoming data: success, channelId, stats, youtube-1
                                    ↑ stats IS available here!

[Pulse] Gmail executed | Result: pending (failed to send proper content?)
        ↑ Executed but with wrong/empty body because of missing reference!
```

The architect **needs output schemas** to know:
1. What YouTube produces (`stats` field)
2. How to reference it (`{{ nodes.youtube-1.stats }}`)
3. That Gmail can use this data

---

## ✨ Bottom Line

| Question | Answer | Status |
|----------|--------|--------|
| Are outputs defined per operation? | NO | ❌ Missing |
| Are they currently used? | NO | ❌ Not used |
| Do we need them? | YES | ✅ Critical |
| Can we add them? | YES | ✅ Easy (90 min) |
| Will it fix the architect? | YES | ✅ Solves root cause |

**This is the ROOT CAUSE of why your YouTube → Gmail workflow "ran but nothing happened"!**

