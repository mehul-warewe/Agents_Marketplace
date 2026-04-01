import express, { Router } from 'express';
import { createClient, agents, agentRuns, users, tools, eq, desc } from '@repo/database';
import passport from './auth.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';
import OpenAI from 'openai';
import { rateLimit } from 'express-rate-limit';
import { NODE_REGISTRY } from '@repo/nodes';
import { generateWorkflow } from './architect-agent.js';

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

const nativeTools = NODE_REGISTRY
    .filter(n => !n.isDecorative)
    .map(n => ({
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

        console.log('[Architect] Processing prompt:', prompt);

        // Use the new LangGraph-based architect agent
        const workflow = await generateWorkflow(prompt);

        if (workflow.error) {
            console.error('[Architect] Error generating workflow:', workflow.error);
            return res.status(400).json({ error: workflow.error });
        }

        console.log('[Architect] Workflow generated successfully');
        res.json(workflow);
    } catch (err: any) {
        console.error('[Architect] Failed:', err);
        res.status(500).json({
            error: 'Failed to architect workflow',
            details: err.message
        });
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
    const { inputData, triggerNodeId, runMode } = req.body;
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
    await executionQueue.add('execute-workflow', { runId: run.id, agentId: agent.id, workflow: agent.workflow, userId: req.user.id, inputData, triggerNodeId, runMode });
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
