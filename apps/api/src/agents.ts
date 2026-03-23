import express, { Router } from 'express';
import { createClient, agents, agentRuns, users, tools, eq, desc } from '@repo/database';
import passport from './auth.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';
import OpenAI from 'openai';
import { rateLimit } from 'express-rate-limit';

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

const nativeTools = [
    { name: "Agent", description: "Autonomous core for processing and action." },
    { name: "OpenAI", description: "Connect OpenAI GPT models." },
    { name: "Gemini", description: "Connect Google Gemini models." },
    { name: "Claude", description: "Connect Anthropic Claude models." },
    { name: "OpenRouter", description: "Connect any model via OpenRouter." }
];

async function ensureToolsExist() {
    // Force a fresh start: Clear the table and re-populate
    const existing = await db.select().from(tools);
    
    // If the tool list has changed (e.g. we only want 'Agent' now), reset it
    const existingNames = existing.map(t => t.name);
    const nativeNames = nativeTools.map(t => t.name);

    const shouldReset = existing.length !== nativeTools.length || 
                      !nativeNames.every(name => existingNames.includes(name));

    if (shouldReset) {
        console.log('[API] Resyncing tool library...');
        // We can't easily perform a complex sync, so we wipe and reload for this clean-slate phase
        // (In a production app, we'd use UPSERT or ID-based syncing)
        await db.delete(tools);
        for (const tool of nativeTools) {
            await db.insert(tools).values({ ...tool, inputSchema: {} });
        }
    }
}

router.post('/architect', async (req: any, res) => {
    try {
        const { prompt, history = [], currentNodes = [], currentEdges = [] } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const systemPrompt = `
You are the "Aether Workflow Architect". Your job is to produce:
1. A valid JSON workflow definition
2. A clear, friendly explanation of the workflow

═══ AVAILABLE NODES (Exact toolId and executionKey) ═══

TRIGGER — starts the flow:
  Trigger        toolId:"trigger.manual"   executionKey:"trigger_manual"  Outputs: "output"
  Chat Trigger   toolId:"trigger.chat"     executionKey:"trigger_chat"    Outputs: "output"
  Webhook        toolId:"trigger.webhook"  executionKey:"trigger_webhook" Outputs: "output"

AGENT — the intelligence core:
  Agent          toolId:"ai.llm"           executionKey:"synthesis"
  Inputs: 
    - "Input"  (primary data, connect from Trigger.output)
    - "Model"  (connect from Model.model)
    - "Memory" (connect from Memory.out)
    - "Tools"  (connect from Tool.output)
  Outputs: "output"
  Config: { "systemPrompt": "...", "userMessage": "{{ message }}" }

CONNECTORS:
  Window Buffer  toolId:"ai.memory.buffer"   executionKey:"memory_buffer"  Inputs: "in", Outputs: "out"
  Gemini/OpenAI/Claude/OpenRouter toolId:"model.[name]" executionKey:"config_model" Outputs: "model"

TOOLS:
  Gmail/Drive/Calendar/Sheets/YouTube toolId:"google.[name]" executionKey:"google_[name]" Inputs: "input", Outputs: "output"
  Logic If       toolId:"logic.if"         executionKey:"logic_if"        Inputs: "input", Outputs: "true", "false"
  Agent Caller   toolId:"tool.agent_caller" executionKey:"tool_agent_caller" Inputs: "input", Outputs: "output"

═══ CONDITIONAL LOGIC ROUTING ═══
- If the user asks for a decision or condition (e.g., "IF it is positive, do X, ELSE do Y"), insert a Logic If node.
- Configure it: { "property": "{{ ids.agentNodeId.field }}", "operator": "equal", "value": "xyz" }.
- Connect its "true" handle to the target node's input. Connect its "false" handle to the other target.

═══ CONNECTION RULES (STRICT CASE SENSITIVITY) ═══
- EVERY workflow must have edges. 
- CONNECT Trigger(output) → Agent(Input)
- CONNECT Model(model) → Agent(Model)
- TO GIVE AGENT CAPABILITIES: CONNECT Tool(output) → Agent(Tools)
- TO ACT AFTER AI: CONNECT Agent(output) → Tool(input)

═══ TOOL DATA REFERENCE ═══
  Agent          → .output
  Gmail Search   → .emails (array)
  Sheets Read    → .data (array)
  YouTube Stats  → .statistics
  Example: "Summarize: {{ ids.n1.output }}"

═══ IMPORTANT RULES ═══
- NO placeholders like "your_email@example.com". Leave empty strings "" for fields the user must fill.
- Explanation must list: ⚙️ Configuration needed (empty fields) and 🔑 Credentials needed.
- Use IDs for variables: {{ ids.n1.output }} is safer than labels.

═══ OUTPUT FORMAT (JSON) ═══
{
  "name": "...",
  "description": "...",
  "explanation": "...",
  "nodes": [
    {"id":"n1","data":{"label":"...","toolId":"...","executionKey":"...","config":{}},"position":{"x":100,"y":250}}
  ],
  "edges": [
    {"id":"e1","source":"n1","sourceHandle":"output","target":"n2","targetHandle":"Input"}
  ]
}

═══ POSITIONS ═══
  Trigger: x=100, y=250 | Agent: x=480, y=250 | Model: x=350, y=500 | Tools: x=580+, y=500`;

        let userMessageContent = `Build a workflow for: ${prompt}`;
        if (currentNodes.length > 0) {
            userMessageContent = `I have an existing workflow. Modify it to fulfill this new request: "${prompt}".\n\nCURRENT NODES:\n${JSON.stringify(currentNodes)}\nCURRENT EDGES:\n${JSON.stringify(currentEdges)}\n\nReturn the FULL updated JSON workflow (preserve existing nodes/edges unless changing them). Keep the same IDs for existing nodes.`;
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
        
        // Ensure backward compat — if no explanation field, make a default
        if (!architected.explanation) {
            architected.explanation = `Workflow "${architected.name || 'Unnamed'}" has been created. Check the canvas and connect your credentials to each node before running.`;
        }

        res.json(architected);
    } catch (err: any) {
        console.error('Architect failed:', err);
      
        res.status(500).json({ error: 'Failed to architect workflow.' });
    }
});


router.get('/', async (req, res) => {
  try {
    // Marketplace only shows published agents
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
    const completedRuns = userRuns.filter(r => r.status === 'completed').length;
    const successRate = totalRuns > 0 ? ((completedRuns / totalRuns) * 100).toFixed(1) : 0;
    res.json({ 
      totalRuns, 
      activeAgents: userAgents.length,
      successRate: parseFloat(successRate.toString()),
      aiUsage: (totalRuns * 0.12).toFixed(2) + "K", 
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
    
    // Check ownership
    const existing = await db.select().from(agents).where(eq(agents.id, req.params.id));
    if (!existing[0] || existing[0].creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the creator can edit this agent.' });
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

    // Clone the agent for the current user
    const acquired = await db.insert(agents).values({
      name: agent.name,
      description: agent.description,
      workflow: agent.workflow,
      category: agent.category,
      price: 0, // In true marketplace this might involve payment
      creatorId: req.user.id,
      isPublished: false, // Acquired copy stays private to the new user
      originalId: agent.id
    }).returning();

    res.json(acquired[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to acquire agent' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    // 1. Verify Ownership
    const existing = await db.select().from(agents).where(eq(agents.id, req.params.id));
    if (!existing[0] || existing[0].creatorId !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized: Only the creator can delete this agent.' });
    }

    // 2. Cleanup Dependencies (in case DB cascade isn't synced yet)
    await db.delete(agentRuns).where(eq(agentRuns.agentId, req.params.id));

    // 3. Final Deletion
    await db.delete(agents).where(eq(agents.id, req.params.id));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to purge agent and history.' });
  }
});

router.post('/:id/run', runLimiter, async (req: any, res) => {
  try {
    const { inputData, triggerNodeId } = req.body;
    const agentRows = await db.select().from(agents).where(eq(agents.id, req.params.id));
    const agent = agentRows[0];
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Ensure the user owns this agent instance
    if (agent.creatorId !== req.user.id) {
       return res.status(403).json({ error: 'You must acquire this agent to your collection before running it.' });
    }

    const runRows = await db.insert(agentRuns).values({
      agentId: agent.id, userId: req.user.id, status: 'pending',
    }).returning();
    const run = runRows[0]!;
    await executionQueue.add('execute-workflow', { runId: run.id, agentId: agent.id, workflow: agent.workflow, userId: req.user.id, inputData, triggerNodeId });
    res.json({ runId: run.id, status: 'queued' });
  } catch (err) {
    console.error('Run failed:', err);
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
