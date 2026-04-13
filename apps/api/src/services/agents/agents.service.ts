import { agents, agentRuns, employeeRuns, employees, eq, desc, and } from '@repo/database';
import { db } from '../../shared/db.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';

const redis = getRedisConnection();
const executionQueue = createExecutionQueue(redis);

export const agentsService = {
  async listPublishedAgents() {
    return await db.select().from(agents)
      .where(eq(agents.isPublished, true))
      .orderBy(desc(agents.createdAt));
  },

  async listMyAgents(userId: string) {
    return await db.select().from(agents).where(eq(agents.creatorId, userId));
  },

  async getAgent(agentId: string) {
    const rows = await db.select().from(agents).where(eq(agents.id, agentId));
    return rows[0];
  },

  async createAgent(userId: string, data: any) {
    const { name, description, workflow, price, category } = data;
    const [newAgent] = await db.insert(agents).values({
      name, description, workflow, price: price || 0, category, creatorId: userId,
    }).returning();
    return newAgent;
  },

  async updateAgent(agentId: string, userId: string, data: any) {
    const { name, description, workflow, price, category, isPublished } = data;
    
    // Ownership check
    const existing = await this.getAgent(agentId);
    if (!existing || existing.creatorId !== userId) {
       throw new Error('Unauthorized or not found');
    }

    const [updated] = await db.update(agents).set({
      name, description, workflow, price, category, isPublished, updatedAt: new Date()
    }).where(eq(agents.id, agentId)).returning();
    
    return updated;
  },

  async deleteAgent(agentId: string, userId: string) {
    const existing = await this.getAgent(agentId);
    if (!existing || existing.creatorId !== userId) {
       throw new Error('Unauthorized or not found');
    }
    
    await db.delete(agentRuns).where(eq(agentRuns.agentId, agentId));
    const [deleted] = await db.delete(agents).where(eq(agents.id, agentId)).returning();
    return deleted;
  },

  async publishAgent(agentId: string, userId: string, data: any) {
    const { published, price, category } = data;
    const existing = await this.getAgent(agentId);
    
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const [updated] = await db.update(agents)
      .set({ 
        isPublished: published === undefined ? existing.isPublished : !!published,
        price: price === undefined ? existing.price : parseFloat(price),
        category: category === undefined ? existing.category : category,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
      .returning();
    
    return updated;
  },

  async acquireAgent(agentId: string, userId: string) {
    const agent = await this.getAgent(agentId);
    
    if (!agent || !agent.isPublished) {
      throw new Error('Marketplace agent not found');
    }

    const [acquired] = await db.insert(agents).values({
      name: agent.name,
      description: agent.description,
      workflow: agent.workflow,
      category: agent.category,
      price: 0,
      creatorId: userId,
      isPublished: false,
      originalId: agent.id
    }).returning();

    return acquired;
  },

  async runAgent(agentId: string, userId: string, data: any) {
    const { inputData, triggerNodeId, runMode } = data;
    const agent = await this.getAgent(agentId);
    if (!agent) throw new Error('Agent not found');

    if (agent.creatorId !== userId) {
       throw new Error('Unauthorized');
    }

    const [run] = await db.insert(agentRuns).values({
      agentId: agent.id, userId, status: 'pending',
    }).returning();
    
    if (!run) throw new Error('Failed to initiate agent run');

    await executionQueue.add('execute-workflow', { 
      runId: run.id, 
      agentId: agent.id, 
      workflow: agent.workflow, 
      userId, 
      inputData, 
      triggerNodeId, 
      runMode 
    });
    
    return { runId: run.id, status: 'queued' };
  },

  async getAgentRun(runId: string) {
    const legacy = await db.select().from(agentRuns).where(eq(agentRuns.id, runId));
    if (legacy.length) return legacy[0];
    
    // Check newline employee runs
    const employeeRunRecord = await db.select().from(employeeRuns).where(eq(employeeRuns.id, runId));
    return employeeRunRecord[0];
  },

  async getMyRuns(userId: string) {
    const legacyRuns = await db.select({
      id: agentRuns.id,
      agentId: agentRuns.agentId,
      agentName: agents.name,
      userId: agentRuns.userId,
      status: agentRuns.status as any,
      startTime: agentRuns.startTime,
      endTime: agentRuns.endTime,
      duration: agentRuns.duration,
      logs: agentRuns.logs,
      output: agentRuns.output,
    }).from(agentRuns)
      .innerJoin(agents, eq(agentRuns.agentId, agents.id))
      .where(eq(agentRuns.userId, userId));

    const eRuns = await db.select({
      id: employeeRuns.id,
      agentId: employeeRuns.employeeId,
      agentName: employees.name,
      userId: employeeRuns.userId,
      status: employeeRuns.status as any,
      startTime: employeeRuns.startTime,
      endTime: employeeRuns.endTime,
      duration: employeeRuns.duration,
      logs: employeeRuns.logs,
      output: employeeRuns.output,
    }).from(employeeRuns)
      .innerJoin(employees, eq(employeeRuns.employeeId, employees.id))
      .where(eq(employeeRuns.userId, userId));

    return [...legacyRuns, ...eRuns].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  async getDashboardStats(userId: string) {
    const aRuns = await db.select().from(agentRuns).where(eq(agentRuns.userId, userId));
    const eRuns = await db.select().from(employeeRuns).where(eq(employeeRuns.userId, userId));
    const userAgents = await db.select().from(agents).where(eq(agents.creatorId, userId));
    const userEmployees = await db.select().from(employees).where(eq(employees.creatorId, userId));
    
    const totalRuns = aRuns.length + eRuns.length;
    const activeEntities = userAgents.length + userEmployees.length;

    const successfulRuns = [...aRuns, ...eRuns].filter(r => r.status === 'completed').length;
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

    return { 
      totalRuns, 
      activeAgents: activeEntities,
      successRate,
      aiUsage: totalRuns > 0 ? `${(totalRuns * 0.12).toFixed(1)}K` : "0", 
      toolsConnected: 4
    };
  },

  async publishAsWorker(agentId: string, userId: string, data: any) {
    const { workerDescription, workerInputSchema, isWorker } = data;
    const existing = await this.getAgent(agentId);
    
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const [updated] = await db.update(agents)
      .set({ 
        isWorker: isWorker === undefined ? true : !!isWorker,
        workerDescription: workerDescription || existing.workerDescription,
        workerInputSchema: workerInputSchema || existing.workerInputSchema,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId))
      .returning();
    
    return updated;
  },

  async listWorkers(userId: string) {
    return await db.select().from(agents)
      .where(and(eq(agents.creatorId, userId), eq(agents.isWorker, true)))
      .orderBy(desc(agents.updatedAt));
  },

  async listWorkerDirectory() {
    return await db.select().from(agents)
      .where(eq(agents.isWorker, true))
      .orderBy(desc(agents.updatedAt));
  }
};
