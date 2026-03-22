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
        const { prompt, history = [] } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const systemPrompt = `
You are the "Aether Workflow Architect". Your job is to produce two things:
1. A valid JSON workflow definition
2. A clear, friendly explanation of the workflow for the user

═══ AVAILABLE NODES (use EXACT toolId and executionKey) ═══

TRIGGER — always the first node (starts the flow):
  Trigger        toolId:"trigger.manual"   executionKey:"trigger_manual"   label:"When clicking 'Execute workflow'"
  Chat Trigger   toolId:"trigger.chat"     executionKey:"trigger_chat"     label:"When chat message received"
  Webhook        toolId:"trigger.webhook"  executionKey:"trigger_webhook"

AGENT — the intelligence core:
  Agent          toolId:"ai.llm"           executionKey:"synthesis"
  Inputs: context (from trigger), Model (from model node), Tools (from tool nodes), Memory (from memory node)
  Config: { 
    "systemPrompt": "You are a specialized agent. For email reports, use beautiful, modern HTML with <div style='...'>, <br>, and standard HTML tags. Avoid plain text for email.",
    "userMessage": "{{ message }}" 
  }

MEMORY CONNECTORS — provide context to the Agent (connect memory → Agent.Memory):
  Window Buffer  toolId:"ai.memory.buffer"   executionKey:"memory_buffer"
  MongoDB Atlas  toolId:"ai.memory.mongodb"  executionKey:"memory_mongodb"
  Redis Cache    toolId:"ai.memory.redis"    executionKey:"memory_redis"

MODEL CONNECTORS — provide the LLM to the Agent (connect model → Agent.Model):
  Gemini         toolId:"model.gemini"     executionKey:"config_model"   config: {"model":"gemini-2.0-flash-001"}
  OpenAI         toolId:"model.openai"     executionKey:"config_model"   config: {"model":"gpt-4o"}
  Claude         toolId:"model.claude"     executionKey:"config_model"   config: {"model":"claude-3-5-sonnet-20240620"}
  OpenRouter     toolId:"model.openrouter" executionKey:"config_model"   config: {"model":"openai/gpt-4o"}

GOOGLE TOOLS — connect tool → Agent.Tools (AGENTIC: the LLM calls them automatically):
  Gmail          toolId:"google.gmail"     executionKey:"google_gmail"
                 operations: send | search | get | reply | mark_read | delete
  Google Drive   toolId:"google.drive"     executionKey:"google_drive"
                 operations: upload | list | get_content | delete | create_folder | share
  Google Calendar toolId:"google.calendar" executionKey:"google_calendar"
                 operations: create | list | get | update | delete
  Google Sheets  toolId:"google.sheets"    executionKey:"google_sheets"
                 operations: append | read | update | clear | create
  YouTube        toolId:"google.youtube"   executionKey:"google_youtube"
                 operations: channel_stats | list_my_videos | video_stats | analytics

═══ TOOL DATA REFERENCE (for variable templating) ═══
  Agent          → .output (main text), .model
  Gmail Search   → .emails (array of {id, subject, snippet, from})
  Gmail Get      → .body (text), .subject, .from
  Google Drive   → .files (array), .content (text from get_content)
  Sheets Read    → .data (array of objects), .rows (raw array)  
  YouTube Stats  → .statistics (views, subscribers), .title
  YouTube List   → .videos (array of {videoId, title})
  
  Example: To get the actual email list for the Agent, use:
  "Here are the emails I found: {{ nodes['Gmail'].emails }}"

═══ CREDENTIALS REQUIRED (tell user exactly what to connect) ═══
  Google Gmail/Drive/Calendar/Sheets → "Google account" (OAuth) — reconnect from the node's credential panel
  YouTube                            → "Google (YouTube)" (OAuth) — reconnect from the YouTube node
  OpenAI model node                  → OpenAI API Key
  Gemini model node                  → Google AI (Gemini) API Key
  Claude model node                  → Anthropic API Key
  OpenRouter model node              → OpenRouter API Key

═══ DATA FLOW & TEMPLATE RULES (STRICT DYNAMIC MAPPING) ═══
  To ensure your workflows are dynamic and never hardcoded:
  - USE IDs for referencing variables: \`{{ ids.n1.output }}\` is more stable than labels.
  - USE labels only for human readability.
  - FALLBACK logic: If you're not sure which field to use for a result, use \`.output\` as the primary key.
  
  Example Path: Trigger (n1) ─context─► Agent (n2) ─output─► Gmail (n3). 
  In Gmail body: "Analysis completed: {{ ids.n2.output }}"

═══ DYNAMIC SCALING RULE ═══
  You are an "Aesthetic Architect" for ANY workflow. Whether it's Finance, YouTube, or Personal CRM:
  1.  Identify the correct specialized Google or Logic tool for the job.
  2.  Chain them modularly (Trigger → Model → Agent → Tools).
  3.  Configure ALL parameters dynamically using variables from the appropriate node IDs.

═══ IMPORTANT CONFIG RULES ═══
  NEVER use placeholder values like "your_email@example.com", "YOUR_ID_HERE", etc.
  For recipient emails or IDs the user must provide: leave the config field EMPTY ("").
  The agent (LLM) will ask the user for these details at runtime if needed.
  In your explanation, you MUST clearly list any fields that the user must fill in manually before the workflow will work (e.g. "To Address" in Gmail, "Spreadsheet ID" in Sheets).

═══ OUTPUT FORMAT (valid JSON, no markdown, no extra text) ═══
{
  "name": "...",
  "description": "...",
  "explanation": "A clear, 2–4 sentence explanation of what this workflow does, written in plain English. \n\nThen list on new lines:\n'⚙️ Configuration needed:' followed by bullet points for any empty fields the user MUST fill (e.g. destination email, sheet ID, etc).\n\nThen list on new lines:\n'🔑 Credentials needed:' followed by bullet points for each service the user must connect.",
  "nodes": [
    {"id":"n1","data":{"label":"...","toolId":"...","executionKey":"...","config":{}},"position":{"x":100,"y":250}}
  ],
  "edges": [
    {"id":"e1","source":"n1","sourceHandle":"context","target":"n2","targetHandle":"context"}
  ]
}

═══ POSITIONS ═══
  Trigger: x=100, y=250
  Agent:   x=480, y=250
  Model:   x=350, y=500  (below Agent)
  Tool 1:  x=580, y=500
  Tool 2:  x=780, y=500
  Tool 3:  x=980, y=500`;

        const messages = [
            { role: 'system', content: systemPrompt },
            // Include prior turns for multi-turn chat
            ...history.map((h: any) => ({ role: h.role, content: h.content })),
            { role: 'user', content: `Build a workflow for: ${prompt}` }
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
