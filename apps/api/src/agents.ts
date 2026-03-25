import express, { Router } from 'express';
import { createClient, agents, agentRuns, users, tools, eq, desc } from '@repo/database';
import passport from './auth.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';
import OpenAI from 'openai';
import { rateLimit } from 'express-rate-limit';
import { NODE_REGISTRY } from '@repo/nodes';

const router: Router = express.Router();
const db = createClient(process.env.POSTGRES_URL!);
const redis = getRedisConnection();
const executionQueue = createExecutionQueue(redis);

// Strict limiter for agent runs
const runLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 runs per minute
  message: { error: 'Too many agent runs. Please wait a minute.' }
});

const openai = new OpenAI({ 
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "warewe AI Architect",
    }
});

router.use(passport.authenticate('jwt', { session: false }));

const nativeTools = NODE_REGISTRY.map(n => ({
    name: n.label,
    description: n.description,
    toolId: n.id,
    executionKey: n.executionKey
}));

async function ensureToolsExist() {
    const existing = await db.select().from(tools);
    const existingIds = existing.map(t => (t as any).toolId);
    const nativeIds = nativeTools.map(t => t.toolId);

    const shouldReset = existing.length !== nativeTools.length || 
                      nativeIds.some(id => !existingIds.includes(id));

    if (shouldReset) {
        console.log('[API] Resyncing tool library from registry...');
        await db.delete(tools);
        for (const tool of nativeTools) {
            await db.insert(tools).values({ 
                name: tool.name, 
                description: tool.description, 
                inputSchema: {} 
            });
        }
    }
}

router.post('/architect', async (req: any, res) => {
    try {
        const { prompt, history = [], currentNodes = [], currentEdges = [] } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const sidebarModules = NODE_REGISTRY.map(n => {
            const allFields = [
                ...n.configFields,
                ...(n.resourceFields ? Object.values(n.resourceFields).flat() : []),
                ...(n.operationFields ? Object.values(n.operationFields).flat() : [])
            ];
            const fieldsList = allFields.map(f => `${f.key}${f.type === 'select' ? '(' + (Array.isArray(f.options) ? f.options.map((o:any) => typeof o === 'string' ? o : o.value).join('|') : '') + ')' : ''}`).join(', ');

            // Add required inputs info
            const requiredInputsInfo = n.requiredInputs && n.requiredInputs.length > 0
              ? `\n  Required Inputs: ${n.requiredInputs.map(inp => `${inp.key}(${inp.type})${inp.required ? '*' : ''}`).join(', ')}`
              : '';

            // Add operation-specific inputs info
            let operationInputsInfo = '';
            if (n.operationInputs && Object.keys(n.operationInputs).length > 0) {
              const operations = Object.entries(n.operationInputs).map(([op, inputs]) => {
                const opInputs = inputs.map((inp: any) => `${inp.key}(${inp.type})${inp.required ? '*' : ''}`).join(', ');
                return `${op}: [${opInputs}]`;
              }).join(' | ');
              operationInputsInfo = `\n  Operation-Specific Inputs: ${operations}`;
            }

            // Add output schema info
            const outputsInfo = n.outputSchema && n.outputSchema.length > 0
              ? `\n  Outputs: ${n.outputSchema.map(out => `${out.key}(${out.type})`).join(', ')}`
              : '';

            return `- ${n.label} (id: "${n.id}"): { ${fieldsList} }${requiredInputsInfo}${operationInputsInfo}${outputsInfo}`;
        }).join('\n');

        const systemPrompt = `
You are the "Aether Workflow Architect". Your job is to produce a PRO-GRADE JSON workflow definition.

═══ AVAILABLE NODES & CONFIG SCHEMAS ═══
${sidebarModules}

═══ 🔴 CRITICAL: CONFIG FILLING STRATEGY ═══
YOUR PRIMARY JOB: Extract values from the user's prompt and populate node configs DIRECTLY.
DO NOT rely on data flowing from previous nodes for STRUCTURAL configuration.

CONFIG vs DATA FLOW:
1. STRUCTURAL CONFIG (set ONCE in node config, extracted from prompt):
   - operation: "send", "search", "create", "list", etc.
   - owner: "microsoft" (extracted from "microsoft/vscode")
   - repo: "vscode" (extracted from "microsoft/vscode")
   - channelId: "C12345" (extracted from "send to #general")
   - projectId: "PROJ-123" (extracted from prompt)
   - resource: "issues", "pull_requests", etc.
   - Subject/Title/Name: Extract literal values like "Bug: Login broken"
   - System/User Messages: Extract and set directly

2. DATA FLOW (use {{ input.field }} when upstream provides variables):
   - Email body that references previous node's transformation
   - Message content that includes previous step's output
   - Dynamic values that change per workflow run

PARSING EXAMPLES:
User says: "Create GitHub issue in microsoft/vscode titled 'Bug: Login fails'"
Extract: operation="create", owner="microsoft", repo="vscode", title="Bug: Login fails"
Config should be: { operation: "create", owner: "microsoft", repo: "vscode", title: "Bug: Login fails" }

User says: "Send email to john@example.com with subject 'Invoice'"
Extract: operation="send", to="john@example.com", subject="Invoice"
Config should be: { operation: "send", to: "john@example.com", subject: "Invoice" }

User says: "Post to Slack #announcements channel"
Extract: operation="send", channelId="#announcements" (or lookup the channel ID if known)
Config should be: { operation: "send", channelId: "#announcements" }

User says: "Search Gmail for emails from john@example.com"
Extract: operation="search", query="from:john@example.com"
Config should be: { operation: "search", query: "from:john@example.com" }

GITHUB-SPECIFIC EXTRACTION:
User says: "Find repositories for user Mehul0161"
  → Operation: "search"
  → Owner: "Mehul0161"
  → Config: { operation: "search", owner: "Mehul0161" }

User says: "Create issue in microsoft/vscode"
  → Operation: "create"
  → Owner: "microsoft" (from "microsoft/vscode")
  → Repo: "vscode" (from "microsoft/vscode")
  → Config: { operation: "create", owner: "microsoft", repo: "vscode", title: "...", body: "..." }

User says: "List pull requests in nodejs/node"
  → Operation: "list"
  → Owner: "nodejs"
  → Repo: "node"
  → Resource: "pull_requests"
  → Config: { operation: "list", owner: "nodejs", repo: "node", resource: "pull_requests" }

═══ 🤖 AI AGENT NODE CONFIG (REQUIRED!) ═══
EVERY AI Agent node MUST have config.userMessage filled with the goal/objective!
This is NOT optional and NOT a template reference - it's the AGENT'S TASK DEFINITION.

How to fill userMessage:
1. Read the user's prompt
2. Extract the INTENT/GOAL/OBJECTIVE
3. Convert to a clear instruction for the agent
4. Put it DIRECTLY in config.userMessage (NOT {{ input.something }})

CRITICAL RULES:
- userMessage is the CORE INSTRUCTION for what the agent should do
- Do NOT leave it empty or undefined
- Do NOT use {{ input.message }} - use the extracted objective from prompt
- Do NOT expect it from upstream nodes - extract from user's request
- Always provide a default if unclear: "Process the input and provide results"

Agent Config Examples - ALWAYS DO THIS:

User says: "I want an agent that creates GitHub issues"
Your response: {
  userMessage: "Create a GitHub issue based on the input provided",
  systemPrompt: "You are a helpful developer assistant..."
}

User says: "Build a workflow that analyzes emails and responds"
Your response: {
  userMessage: "Analyze the email message and provide a helpful response",
  systemPrompt: "..."
}

User says: "Chat trigger with an agent"
Your response: {
  userMessage: "Respond helpfully to the user's chat message",
  systemPrompt: "..."
}

User says: "Process incoming data with an AI agent"
Your response: {
  userMessage: "Process the incoming data and extract meaningful information",
  systemPrompt: "..."
}

═══ 🔗 INTELLIGENT FIELD MAPPING (SEMANTIC MATCHING) ═══
When nodes are connected, field names may NOT match exactly. DO NOT FAIL.
Instead, use SEMANTIC MATCHING based on field descriptions and context.

MAPPING ALGORITHM:
1. Look at UPSTREAM node's outputSchema (what it produces)
2. Look at DOWNSTREAM node's requiredInputs (what it needs)
3. Read the DESCRIPTIONS to understand what each field MEANS
4. Match semantically: "email_address" (description: "recipient email") → "to" (description: "email recipient")
5. Generate template reference: config.to = "{{ input.email_address }}"

EXAMPLE:
Upstream outputs:
  { email_address (string): "The recipient email address" }
  { full_name (string): "User's full name" }
  { count (number): "Total items" }

Downstream needs:
  { to (string): "Email recipient address" } ← Match: email_address → email_address is about recipient
  { subject (string): "Email subject" } ← Match: full_name → Use in subject via template
  { body (string): "Email body" } ← No exact match, use generic or skip

Your node config:
{
  to: "{{ input.email_address }}",      // ← Semantic match (recipient → to)
  subject: "From {{ input.full_name }}", // ← Semantic match (name → subject)
  body: "Please review."                 // ← Static, no mapping needed
}

KEY PRINCIPLES:
- Field names DON'T have to match exactly
- Use descriptions to find semantic equivalents
- If types match and meanings are similar, create the mapping
- Generate {{ input.fieldName }} templates automatically
- If no upstream field matches, set static value in config

FIELD SIMILARITY HINTS:
- "email" / "email_address" / "recipient" → "to"
- "title" / "subject" / "name" → "subject" / "title"
- "body" / "content" / "message" / "text" → "body" / "content"
- "sender" / "from" → "from"
- "date" / "timestamp" / "created_at" → "timestamp"

═══ INPUT/OUTPUT CONTRACT (CRITICAL!) ═══
Each node has:
- Required Inputs (*): Data it MUST receive from upstream (e.g., operation, owner, repo)
- Operation-Specific Inputs: Different inputs for different operations
  - Gmail "send" needs: to, subject, body
  - Gmail "search" needs: query, maxResults
  - GitHub "create" needs: owner, repo, title, body
  - GitHub "list" needs: owner, repo
- Outputs: Data it produces for downstream nodes (e.g., messageId, status, result)

VALIDATION RULES:
1. ALWAYS SET operation IN NODE CONFIG: Parse the prompt to determine which operation is needed.
   - Do NOT expect operation to come from previous node output
   - Set it once in config based on what user is asking for
2. FILL REQUIRED FIELDS FROM PROMPT: owner, repo, channelId, projectId, etc.
   - Parse the prompt intelligently
   - Extract literal values (not placeholders)
   - Example: "in microsoft/vscode" → owner: "microsoft", repo: "vscode"
3. USE TEMPLATE REFERENCES ONLY FOR DATA TRANSFORMATION:
   - Use {{ input.field }} ONLY when upstream provides dynamic data
   - Example: Gmail send "body" might reference {{ input.message_content }} if previous node generated it
4. MUST MATCH TYPES: Data flowing between nodes must match in type
5. NO MISSING INPUTS: If a node requires 'channelId' and upstream doesn't provide it, set it in config or add Code node
6. ENRICHMENT: Use Code nodes to transform/enrich data if needed

═══ SPECIAL RULES ═══
- ALL platform tools (GitHub, Slack, etc.) use the ".mcp" suffix (e.g., github.mcp).
- ALWAYS include ONE "trigger.manual" (unless user specified another).
- PATTERN: Use ONE "ai.llm" node. Connect all platform tools to its "Tools" port.
- FULLY CONFIGURE NODES: Populate the "config" object for ALL nodes based on the prompt.
  - For AI Agent: Must set "userMessage" (the objective) and "systemPrompt"!
  - For Connectors: Set "operation" FIRST (critical!), then "resource" if applicable.
    MUST fill ALL required fields like "owner", "repo", "channelId", "projectId" by PARSING THE PROMPT.
    Do NOT expect these to come from previous nodes. Extract them directly from user intent.
  - For Values: NEVER use placeholders like "REPO_NAME". Always use the actual value extracted from the prompt.
  - For Code: Use {{ input.field }} or "input" to access data from the previous node. Return an object.
- CASE SENSITIVE HANDLES:
  - Agent: Input, Model, Tools, Memory, Parser (TitleCase)
  - Tools/Triggers/Models: input, output, model (lowercase)

═══ CONNECTION RULES ═══
A. Trigger.output -> Agent.Input
B. Model.model -> Agent.Model
C. Tool.output -> Agent.Tools
D. Agent.output -> Tool.input

═══ POSITIONING (LEFT-TO-RIGHT) ═══
1. COL 1 (Triggers): x: 100, y: 300 + (index * 250)
2. COL 2 (Brain):
   - Agent: x: 550, y: 300
   - Model (below): x: 550, y: 550
   - Memory (below): x: 550, y: 750
3. COL 3 (Actions): x: 1000, y: 300 + (index * 350)

═══ OUTPUT FORMAT ═══
Return a JSON object with:
- "name": String
- "description": String
- "explanation": Markdown telling a story of how the data flows + final setup list.
- "nodes": Array of { id, data: { label, toolId, executionKey, isTrigger, config: { ... } }, position }
- "edges": Array of { id, source, sourceHandle, target, targetHandle }

ENSURE ALL HANDLES MATCH CASE: Agent(Input, Model, Tools, Memory, Parser).`;

        let userMessageContent = `Build a workflow for: ${prompt}`;
        if (currentNodes.length > 0) {
            userMessageContent = `Modify this existing workflow: "${prompt}".\n\nCURRENT NODES:\n${JSON.stringify(currentNodes)}\nCURRENT EDGES:\n${JSON.stringify(currentEdges)}\n\nReturn the FULL JSON.`;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map((h: any) => ({ role: h.role, content: h.content })),
            { role: 'user', content: userMessageContent }
        ];

        const response = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-001",
            messages: messages as any,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message.content || '{}';
        const architected = JSON.parse(content);
        
        if (!architected.explanation) {
            architected.explanation = "Workflow generated. Please check the canvas and connect your credentials.";
        }

        res.json(architected);
    } catch (err: any) {
        console.error('Architect failed:', err);
        res.status(500).json({ error: 'Failed to architect workflow.' });
    }
});

router.get('/', async (req, res) => {
  try {
    const allAgents = await db.select().from(agents)
      .where(eq(agents.isPublished, true))
      .orderBy(desc(agents.createdAt));
    res.json(allAgents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

router.get('/my-runs', async (req: any, res) => {
  try {
    const runs = await db.select({
      id: agentRuns.id,
      agentId: agentRuns.agentId,
      agentName: agents.name,
      userId: agentRuns.userId,
      status: agentRuns.status,
      startTime: agentRuns.startTime,
      endTime: agentRuns.endTime,
      duration: agentRuns.duration,
      logs: agentRuns.logs,
      output: agentRuns.output,
    }).from(agentRuns)
      .innerJoin(agents, eq(agentRuns.agentId, agents.id))
      .where(eq(agentRuns.userId, req.user.id))
      .orderBy(desc(agentRuns.startTime));
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

router.get('/tools/available', async (req, res) => {
  try {
    await ensureToolsExist();
    const allTools = await db.select().from(tools);
    res.json(allTools);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/dashboard-stats', async (req: any, res) => {
  try {
    const userRuns = await db.select().from(agentRuns).where(eq(agentRuns.userId, req.user.id));
    const userAgents = await db.select().from(agents).where(eq(agents.creatorId, req.user.id));
    const totalRuns = userRuns.length;
    res.json({ 
      totalRuns, 
      activeAgents: userAgents.length,
      successRate: 100,
      aiUsage: "2.4K", 
      toolsConnected: 4
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats error' });
  }
});

router.get('/mine', async (req: any, res) => {
  try {
    const myAgents = await db.select().from(agents).where(eq(agents.creatorId, req.user.id));
    res.json(myAgents);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const agentRows = await db.select().from(agents).where(eq(agents.id, req.params.id));
    const agent = agentRows[0];
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { name, description, workflow, price, category } = req.body;
    const newAgent = await db.insert(agents).values({
      name, description, workflow, price: price || 0, category, creatorId: req.user.id,
    }).returning();
    res.status(201).json(newAgent[0]);
  } catch (err) {
    res.status(500).json({ error: 'Create failed' });
  }
});

router.patch('/:id', async (req: any, res) => {
  try {
    const { name, description, workflow, price, category, isPublished } = req.body;
    
    // Ownership check
    const existing = await db.select().from(agents).where(eq(agents.id, req.params.id));
    if (!existing[0] || existing[0].creatorId !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedAgent = await db.update(agents).set({
      name, description, workflow, price, category, isPublished
    }).where(eq(agents.id, req.params.id)).returning();
    res.json(updatedAgent[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/:id/publish', async (req: any, res) => {
  try {
    const { published, price, category } = req.body;
    const existing = await db.select().from(agents).where(eq(agents.id, req.params.id));
    
    if (!existing[0] || existing[0].creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await db.update(agents)
      .set({ 
        isPublished: published === undefined ? existing[0].isPublished : !!published,
        price: price === undefined ? existing[0].price : parseFloat(price),
        category: category === undefined ? existing[0].category : category
      })
      .where(eq(agents.id, req.params.id))
      .returning();
    
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to publish' });
  }
});

router.post('/:id/acquire', async (req: any, res) => {
  try {
    const marketplaceAgent = await db.select().from(agents).where(eq(agents.id, req.params.id));
    const agent = marketplaceAgent[0];
    
    if (!agent || !agent.isPublished) {
      return res.status(404).json({ error: 'Marketplace agent not found' });
    }

    const acquired = await db.insert(agents).values({
      name: agent.name,
      description: agent.description,
      workflow: agent.workflow,
      category: agent.category,
      price: 0,
      creatorId: req.user.id,
      isPublished: false,
      originalId: agent.id
    }).returning();

    res.json(acquired[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to acquire agent' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const existing = await db.select().from(agents).where(eq(agents.id, req.params.id));
    if (!existing[0] || existing[0].creatorId !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized' });
    }
    await db.delete(agentRuns).where(eq(agentRuns.agentId, req.params.id));
    await db.delete(agents).where(eq(agents.id, req.params.id));
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.post('/:id/run', runLimiter, async (req: any, res) => {
  try {
    const { inputData, triggerNodeId } = req.body;
    const agentRows = await db.select().from(agents).where(eq(agents.id, req.params.id));
    const agent = agentRows[0];
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    if (agent.creatorId !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized' });
    }

    const runRows = await db.insert(agentRuns).values({
      agentId: agent.id, userId: req.user.id, status: 'pending',
    }).returning();
    const run = runRows[0]!;
    await executionQueue.add('execute-workflow', { runId: run.id, agentId: agent.id, workflow: agent.workflow, userId: req.user.id, inputData, triggerNodeId });
    res.json({ runId: run.id, status: 'queued' });
  } catch (err) {
    res.status(500).json({ error: 'Run failed' });
  }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const runRows = await db.select().from(agentRuns).where(eq(agentRuns.id, req.params.id));
    res.json(runRows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

export default router;
