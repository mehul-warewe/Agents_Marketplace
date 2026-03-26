# Architect Feature - Complete Workflow Overview

## 📋 High-Level Architecture

The Architect is an **AI-powered workflow generator** that converts natural language prompts into executable workflow definitions. It uses an agentic approach with tool use to intelligently build workflows step-by-step.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                               │
│                     ArchitectBar Component                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ User enters prompt: "Send email when chat message arrives"  │   │
│  │ Clicks "Build" button                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ POST /agents/architect
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  EXPRESS API ENDPOINT                               │
│              /api/agents/architect (agents.ts:61-85)                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Receives: { prompt, history, currentNodes, currentEdges }  │   │
│  │ Calls: generateWorkflow(prompt)                             │   │
│  │ Returns: { name, description, nodes[], edges[] }           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              AI ARCHITECT AGENT (architect-agent.ts)                │
│  Uses LangChain + Gemini 2.0 Flash (via OpenRouter)                │
│                                                                     │
│  ┌─ AGENT LOOP (Iterations 1-15) ──────────────────────────────┐   │
│  │  1. Send user prompt + system instructions                  │   │
│  │  2. Model responds with tool calls or text                  │   │
│  │  3. Execute tools (8 total - see below)                     │   │
│  │  4. Feed results back to model                              │   │
│  │  5. Repeat until build_workflow is called                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Final Output: Complete workflow JSON with nodes & edges            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ JSON response
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 CANVAS NORMALIZATION                                │
│          normaliseArchitectNodes (AgentBuilder.tsx:124)             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Match architect nodes to TOOL_REGISTRY                      │   │
│  │ Transform to ReactFlow format                               │   │
│  │ Inject canvas handlers & metadata                           │   │
│  │ Output: Canvas-ready nodes[] & edges[]                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ setNodes(ns), setEdges(es)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   REACTFLOW CANVAS                                  │
│              Workflow displayed & editable by user                  │
│         User can manually adjust, run, or save the workflow         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Architect Tools (architect-tools.ts)

The architect uses **8 specialized tools** that are called in a specific order to build workflows:

### Tool 1: `choose_trigger` (Lines 23-77)
- **Purpose:** Determines which trigger type should start the workflow
- **Input:** User prompt (e.g., "send email when chat message arrives")
- **Output:** `{ trigger: "chat|manual|webhook", reason: "brief reason" }`
- **Logic:** Uses LLM to classify prompt keywords
  - **"chat"** → When keywords: "chat", "message", "user input", "interactive", "ask"
  - **"manual"** → When: automation task, batch job, scheduled, default
  - **"webhook"** → When keywords: "webhook", "API", "HTTP", "external system"

### Tool 2: `extract_intent` (Lines 82-145)
- **Purpose:** Extract structured intent from the prompt
- **Input:** User prompt
- **Output:**
  ```json
  {
    "platforms": ["Gmail", "GitHub"],
    "primaryOperation": "send",
    "staticFields": { "to": "alice@company.com", "owner": "microsoft" },
    "dynamicFields": { "body": "message", "email": "recipientEmail" },
    "dataFlow": "single|multiple",
    "explanation": "Brief explanation"
  }
  ```
- **Key Concepts:**
  - **staticFields**: Values explicitly in the prompt (literal values)
  - **dynamicFields**: Values that come from user input (use `{{ input.fieldName }}`)
  - **dataFlow**: "single" (one action) or "multiple" (chained actions)

### Tool 3: `list_all_operations` (Lines 150-207)
- **Purpose:** List all available operations for a platform
- **Input:** Platform name (e.g., "Gmail", "GitHub")
- **Output:** Array of operations with required/optional inputs
  ```json
  {
    "operations": [
      {
        "platform": "Gmail",
        "operation": "send",
        "required": ["to", "subject"],
        "optional": ["body", "cc"],
        "description": "Send an email message"
      }
    ]
  }
  ```
- **Uses:** NODE_REGISTRY to get all platform definitions

### Tool 4: `get_operation_schema` (Lines 212-295)
- **Purpose:** Get detailed schema for a specific operation
- **Input:** `{ platform: "Gmail", operation: "send" }`
- **Output:**
  ```json
  {
    "platform": "Gmail",
    "operation": "send",
    "resource": "Gmail",
    "inputs": [
      { "key": "to", "required": true, "type": "string", "description": "..." },
      { "key": "subject", "required": true, "type": "string", "description": "..." },
      { "key": "body", "required": false, "type": "string", "description": "..." }
    ]
  }
  ```

### Tool 5: `assemble_node_config` (Lines 428-502)
- **Purpose:** Build the complete config object for a node
- **Input:**
  ```json
  {
    "platform": "Gmail",
    "operation": "send",
    "operationSchema": [{ key: "to", required: true }, ...],
    "staticFields": { "to": "alice@company.com" },
    "dynamicFields": { "body": "message" }
  }
  ```
- **Output:**
  ```json
  {
    "config": {
      "operation": "send",
      "to": "alice@company.com",
      "subject": "{{ input.subject }}",
      "body": "{{ input.message }}"
    },
    "resource": "Gmail",
    "missingRequired": []
  }
  ```
- **Algorithm:**
  1. For each input in the operation schema:
     - Is it in `staticFields`? → Use literal value
     - Is it in `dynamicFields`? → Use `{{ input.fieldName }}`
     - Is it required but missing? → Use `{{ input.key }}`
     - Is it optional? → Skip it

### Tool 6: `build_nodes` (Lines 508-675)
- **Purpose:** Create proper node objects with all parameters
- **Input:**
  ```json
  {
    "nodes": [
      {
        "type": "trigger",
        "trigger": "chat|manual|webhook",
        "config": { "responseMode": "When execution is finished" },
        "id": "trigger-chat",
        "position": { "x": 0, "y": 0 }
      },
      {
        "type": "platform",
        "platform": "Gmail",
        "operation": "send",
        "config": {
          "operation": "send",
          "to": "alice@company.com",
          "subject": "{{ input.subject }}"
        },
        "id": "gmail-1",
        "position": { "x": 200, "y": 0 }
      }
    ]
  }
  ```
- **Output:** Complete node objects ready for ReactFlow
- **Validates:**
  - All required fields are present in config
  - Operation exists for platform
  - Auto-infers resource field if missing

### Tool 7: `build_workflow` (Lines 680-711)
- **Purpose:** Finalize workflow with name, description, nodes, and edges
- **Input:**
  ```json
  {
    "name": "Email on Chat Message",
    "description": "Sends an email whenever someone messages...",
    "nodes": [...],
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
  ```
- **Output:** Complete workflow JSON (ready for canvas)

---

## 📝 Complete Generation Pipeline

### Step 1: User Types Prompt
```
User: "Create a chat workflow that sends emails to users who message"
```

### Step 2: AI Agent Loop Begins
The system prompt tells the model to follow this pipeline (architect-agent.ts:346-355):

```
1. **Trigger Calculation** → Call choose_trigger
   Model: "This is chat-based, so chat trigger"
   Tool: choose_trigger("Create a chat workflow...")
   Result: { trigger: "chat", reason: "Interactive chat workflow" }

2. **Intent Analysis** → Call extract_intent
   Model: "Platform: Gmail, Operation: send, Email from chat input"
   Tool: extract_intent("Create a chat workflow...")
   Result: {
     platforms: ["Gmail"],
     primaryOperation: "send",
     staticFields: {},
     dynamicFields: { "to": "email", "body": "message" }
   }

3. **Operations Discovery** → Call list_all_operations
   Model: "List all Gmail operations to find send operation"
   Tool: list_all_operations("Gmail")
   Result: [{ operation: "send", required: ["to", "subject"], ... }, ...]

4. **Schema Retrieval** → Call get_operation_schema
   Model: "Get schema for Gmail send operation"
   Tool: get_operation_schema({ platform: "Gmail", operation: "send" })
   Result: {
     inputs: [
       { key: "to", required: true },
       { key: "subject", required: true },
       { key: "body", required: false }
     ]
   }

5. **Node Construction** → Call assemble_node_config + build_nodes
   Model: "Build config using extracted intent and schema"
   Tool: assemble_node_config({
     platform: "Gmail",
     operation: "send",
     operationSchema: [...],
     staticFields: {},
     dynamicFields: { "to": "email", "body": "message" }
   })
   Result: config = {
     operation: "send",
     to: "{{ input.email }}",
     subject: "{{ input.subject }}",
     body: "{{ input.message }}"
   }

   Tool: build_nodes({
     nodes: [
       { type: "trigger", trigger: "chat", ... },
       { type: "platform", platform: "Gmail", operation: "send", config: {...} }
     ]
   })
   Result: Complete node objects

6. **Finalization** → Call build_workflow
   Model: "Build final workflow with edges"
   Tool: build_workflow({
     name: "Email on Chat Message",
     description: "Sends an email when users message the chat",
     nodes: [...],
     edges: [{ source: "trigger-chat", target: "gmail-1", ... }]
   })
   Result: { name, description, nodes, edges }
```

### Step 3: Response Reaches Frontend
```javascript
// In AgentBuilder.tsx:557-584
const handleArchitect = (prompt: string) => {
  architect({ prompt, history }, {
    onSuccess: (data: any) => {
      // data.nodes and data.edges come from architect
      const { nodes: ns, edges: es } = normaliseArchitectNodes(
        data.nodes,
        data.edges
      );
      setNodes(ns);  // Place nodes on canvas
      setEdges(es);  // Connect with edges
    }
  });
};
```

### Step 4: Canvas Normalization (normaliseArchitectNodes)
The raw architect output is transformed to match the canvas format:

```javascript
function normaliseArchitectNodes(rawNodes, rawEdges) {
  const nodes = rawNodes.map((n, i) => {
    // 1. Match architect node to TOOL_REGISTRY
    let resolvedTool = matchByToolId(n)
                    || matchByExecutionKey(n)
                    || fuzzyMatch(n);

    // 2. Merge config from architect
    const config = { ...n.data, ...n.data?.config };

    // 3. Return canvas-ready node
    return {
      id: n.id,
      type: 'wareweNode',
      position: n.position || { x: 100 + i*320, y: 200 },
      data: {
        label: resolvedTool.label,
        toolId: resolvedTool.id,
        config: config,
        status: 'idle',
        isTrigger: resolvedTool.isTrigger,
        // Inject handlers for canvas interaction
        onTrigger: handleTrigger,
        onAddConnect: handleAddConnect
      }
    };
  });

  const edges = rawEdges.map(e => ({ ...e, ...EDGE_DEFAULTS }));
  return { nodes, edges };
}
```

### Step 5: Canvas Display
Nodes appear on the ReactFlow canvas with proper positions, labels, and connections. User can:
- Edit node configs by clicking nodes (opens NodeConfigPanel)
- Add credentials to nodes
- Manually adjust connections
- Run the workflow

---

## 🔄 System Flow Diagram

```
┌────────────────────┐
│   User Prompt      │
│  "Send email when  │
│   chat arrives"    │
└─────────┬──────────┘
          │
          ▼
    ┌─────────────┐
    │ ArchitectBar│  ← User types in this component
    └──────┬──────┘
           │ handleArchitect(prompt, history)
           │ (useArchitect mutation)
           │
           ▼
    POST /agents/architect
           │
           ▼
    ┌──────────────────────────┐
    │  generateWorkflow()       │
    │  (architect-agent.ts)     │
    │                           │
    │  ChatOpenAI + LangChain   │
    │  Model: Gemini 2.0 Flash  │
    └──────────┬───────────────┘
               │ Agent Loop (up to 15 iterations)
               │
         ┌─────▼──────────┐
         │ Tool Calls:    │
         │ 1. choose_trigger
         │ 2. extract_intent
         │ 3. list_all_operations
         │ 4. get_operation_schema
         │ 5. assemble_node_config
         │ 6. build_nodes
         │ 7. build_workflow
         └─────┬──────────┘
               │
               ▼
        ┌──────────────┐
        │ Final JSON:  │
        │ {            │
        │  name,       │
        │  nodes[],    │
        │  edges[]     │
        │ }            │
        └──────┬───────┘
               │ Response
               │
               ▼
    ┌──────────────────────────┐
    │ normaliseArchitectNodes()  │
    │ (AgentBuilder.tsx)         │
    │                            │
    │ Transform to ReactFlow fmt │
    │ Match to TOOL_REGISTRY     │
    │ Inject handlers            │
    └──────────┬─────────────────┘
               │
      ┌────────▼────────┐
      │  setNodes(ns)   │
      │  setEdges(es)   │
      └────────┬────────┘
               │
               ▼
    ┌──────────────────────────┐
    │   ReactFlow Canvas        │
    │  (AgentBuilder.tsx)       │
    │                           │
    │  ┌─────────────────────┐  │
    │  │ Trigger (Chat)      │  │
    │  └──────────┬──────────┘  │
    │             │ edge        │
    │             ▼             │
    │  ┌─────────────────────┐  │
    │  │ Gmail (Send Email)  │  │
    │  └─────────────────────┘  │
    │                           │
    │  Ready for user to:       │
    │  • Edit configs           │
    │  • Add credentials        │
    │  • Connect more nodes     │
    │  • Run the workflow       │
    └──────────────────────────┘
```

---

## 🔧 Key Implementation Details

### Trigger Detection Logic (choose_trigger tool)
```javascript
// Input: "Create a chat workflow..."
// Output: trigger = "chat"

// Keywords:
// - Chat: "chat", "message", "user sends", "ask user", "interactive"
// - Webhook: "webhook", "API", "HTTP", "external system"
// - Manual: Default, "schedule", "batch job", "automation"
```

### Intent Extraction (extract_intent tool)
- **staticFields**: Hardcoded values from the prompt
  - Example: "send to alice@company.com" → to: "alice@company.com"
- **dynamicFields**: References to input data
  - Example: "with message from chat" → body: "message"
  - Later rendered as `{{ input.message }}`

### Config Assembly Algorithm (assemble_node_config tool)
For each input in the operation schema:
1. Is it in `staticFields`? ✓ Use static value
2. Is it in `dynamicFields`? ✓ Use `{{ input.fieldName }}`
3. Is it required? ✓ Use `{{ input.key }}`
4. Is it optional? ✗ Skip it

Result: Complete config with no missing required fields.

### Canvas Integration (normaliseArchitectNodes)
Three matching strategies (in order):
1. **Exact match** by `toolId` in architect output
2. **Fallback 1** by `executionKey` from registry
3. **Fallback 2** fuzzy label/description match against all nodes

Merges architect flat config into a single config object for the canvas.

---

## 📊 Example Workflow Generation

**Input Prompt:**
```
"Create a workflow that listens for YouTube videos,
checks if view count exceeds 1000, and sends a Slack
notification to #analytics with the video title and link"
```

**Generated Workflow:**

```json
{
  "name": "YouTube Analytics Monitor",
  "description": "Monitors YouTube videos and alerts Slack when...",
  "nodes": [
    {
      "id": "trigger-webhook",
      "label": "Webhook",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Webhook",
        "config": {
          "responseMode": "When execution is finished"
        }
      }
    },
    {
      "id": "youtube-1",
      "label": "YouTube",
      "position": { "x": 200, "y": 0 },
      "data": {
        "label": "YouTube",
        "config": {
          "operation": "get_video_stats",
          "videoId": "{{ input.videoId }}",
          "resource": "YouTube"
        }
      }
    },
    {
      "id": "code-1",
      "label": "Code",
      "position": { "x": 400, "y": 0 },
      "data": {
        "label": "Code (Check View Count)",
        "config": {
          "code": "return obj.views > 1000;"
        }
      }
    },
    {
      "id": "slack-1",
      "label": "Slack",
      "position": { "x": 600, "y": 0 },
      "data": {
        "label": "Slack",
        "config": {
          "operation": "send_message",
          "channel": "#analytics",
          "message": "🎬 Video Alert!\nTitle: {{ nodes.youtube-1.title }}\nViews: {{ nodes.youtube-1.views }}\nLink: {{ nodes.youtube-1.url }}",
          "resource": "Slack"
        }
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "trigger-webhook", "target": "youtube-1" },
    { "id": "e2", "source": "youtube-1", "target": "code-1" },
    { "id": "e3", "source": "code-1", "target": "slack-1" }
  ]
}
```

---

## ⚡ Performance & Optimization

- **Agent Loop Timeout**: 15 iterations max (architect-agent.ts:364)
- **Tool Limitations**: List operations returns first 20 (architect-tools.ts:201)
- **LLM Model**: Google Gemini 2.0 Flash for speed & cost
- **API**: OpenRouter for unified LLM access

---

## 🚀 How It's Used in Canvas

1. **ArchitectBar Component** (bottom of canvas)
   - Expandable chat interface
   - Shows conversation history
   - "Build" button triggers generation

2. **Integration with AgentBuilder**
   - `useArchitect` hook sends POST to `/agents/architect`
   - Response nodes/edges placed directly on canvas
   - `normaliseArchitectNodes` ensures compatibility

3. **User Workflow After Generation**
   - Edit node configs (click node → NodeConfigPanel)
   - Add credentials to each node (select from Credentials dropdown)
   - Manually adjust node positions
   - Add additional nodes if needed
   - Save and Run the workflow

---

## 🎯 Key Takeaways

1. **Architect is an AI Agent**: Uses LangChain with tool use, not simple prompt engineering
2. **Systematic Tool Pipeline**: Every workflow generation follows the same 7-step tool pipeline
3. **Smart Intent Extraction**: Understands which fields are static vs. dynamic from natural language
4. **Canvas-Ready Output**: Generated workflows are immediately usable—just needs credentials
5. **Iterative Refinement**: User can refine prompts multiple times in the same chat session
6. **Normalisation Bridge**: `normaliseArchitectNodes` ensures architect output matches canvas format

This design allows users to quickly generate complex multi-step workflows from simple descriptions while maintaining full control to edit and customize before running.
