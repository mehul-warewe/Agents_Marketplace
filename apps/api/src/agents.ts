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

        const sidebarModules = NODE_REGISTRY.map(n => 
            `- ${n.label}: toolId:"${n.id}" executionKey:"${n.executionKey}" Category:"${n.category}"`
        ).join('\n');

        const systemPrompt = `
You are the "Aether Workflow Architect". Your job is to produce a JSON workflow definition.

═══ AVAILABLE NODES ═══
${sidebarModules}

═══ SPECIAL RULES ═══
- ALL platform tools (GitHub, Slack, etc.) use the ".mcp" suffix (e.g., github.mcp).
- AI Agent (ai.llm) is the core. Connect Model/Memory/Tools to its sockets.

═══ CONNECTION RULES (STRICT) ═══
A. TRIGGER -> AGENT: Source: Trigger.output | Target: Agent.Input
B. MODEL -> AGENT: Source: Model.model | Target: Agent.Model
C. CAPABILITY: Tool.output → Agent.Tools
D. ACTION: Agent.output → Tool.input

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
- "nodes": Array of {id, data, position}
- "edges": Array of {id, source, sourceHandle, target, targetHandle}

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
    const updatedAgent = await db.update(agents).set({
      name, description, workflow, price, category, isPublished
    }).where(eq(agents.id, req.params.id)).returning();
    res.json(updatedAgent[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/:id/run', runLimiter, async (req: any, res) => {
  try {
    const { inputData, triggerNodeId } = req.body;
    const agentRows = await db.select().from(agents).where(eq(agents.id, req.params.id));
    const agent = agentRows[0];
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

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
