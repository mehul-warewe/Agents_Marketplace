import { employees, employeeRuns, skills, eq, and, desc, inArray } from '@repo/database';
import { ChatOpenAI } from "@langchain/openai";
import { db } from '../../shared/db.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';
import { knowledgeService } from '../knowledge/knowledge.service.js';

const redis = getRedisConnection();
const executionQueue = createExecutionQueue(redis);

export const employeesService = {
  async listEmployees(userId: string) {
    return await db.select().from(employees).where(eq(employees.creatorId, userId));
  },

  async getEmployee(employeeId: string) {
    const rows = await db.select().from(employees).where(eq(employees.id, employeeId));
    return rows[0];
  },

  async createEmployee(userId: string, data: any) {
    const { name, description, avatar, systemPrompt, model } = data;
    const [newEmployee] = await db.insert(employees).values({
      name,
      description,
      avatar,
      systemPrompt,
      model,
      creatorId: userId,
    }).returning();
    return newEmployee;
  },

  async updateEmployee(employeeId: string, userId: string, data: any) {
    const existing = await this.getEmployee(employeeId);
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const [updated] = await db.update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, employeeId))
      .returning();
    return updated;
  },

  async deleteEmployee(employeeId: string, userId: string) {
    const existing = await this.getEmployee(employeeId);
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    await db.delete(employeeRuns).where(eq(employeeRuns.employeeId, employeeId));
    const [deleted] = await db.delete(employees).where(eq(employees.id, employeeId)).returning();
    return deleted;
  },

  async assignSkill(employeeId: string, userId: string, data: { skillId: string, instruction?: string }) {
    const employee = await this.getEmployee(employeeId);
    if (!employee || employee.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const skillIds = employee.skillIds || [];
    if (!skillIds.includes(data.skillId)) {
      skillIds.push(data.skillId);
    }

    const skillInstructions = employee.skillInstructions || {};
    if (data.instruction) {
      skillInstructions[data.skillId] = data.instruction;
    }

    const [updated] = await db.update(employees).set({
      skillIds,
      skillInstructions,
      updatedAt: new Date()
    }).where(eq(employees.id, employeeId)).returning();

    return updated;
  },

  async removeSkill(employeeId: string, userId: string, skillId: string) {
    const employee = await this.getEmployee(employeeId);
    if (!employee || employee.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const skillIds = (employee.skillIds || []).filter(id => id !== skillId);
    const skillInstructions = { ...employee.skillInstructions };
    delete skillInstructions[skillId];

    const [updated] = await db.update(employees).set({
      skillIds,
      skillInstructions,
      updatedAt: new Date()
    }).where(eq(employees.id, employeeId)).returning();

    return updated;
  },

  async assignKnowledge(employeeId: string, userId: string, knowledgeId: string) {
    const employee = await this.getEmployee(employeeId);
    if (!employee || employee.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const knowledgeIds = (employee as any).knowledgeIds || [];
    if (!knowledgeIds.includes(knowledgeId)) {
      knowledgeIds.push(knowledgeId);
    }

    const [updated] = await db.update(employees).set({
      knowledgeIds,
      updatedAt: new Date()
    }).where(eq(employees.id, employeeId)).returning();

    return updated;
  },

  async removeKnowledge(employeeId: string, userId: string, knowledgeId: string) {
    const employee = await this.getEmployee(employeeId);
    if (!employee || employee.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const knowledgeIds = ((employee as any).knowledgeIds || []).filter((id: string) => id !== knowledgeId);

    const [updated] = await db.update(employees).set({
      knowledgeIds,
      updatedAt: new Date()
    }).where(eq(employees.id, employeeId)).returning();

    return updated;
  },

  async runEmployee(employeeId: string, userId: string, task: string, context: any = {}) {
    const employee = await this.getEmployee(employeeId);
    if (!employee) throw new Error('Employee not found');

    const skillIds = employee.skillIds || [];
    if (skillIds.length === 0) {
      throw new Error('Employee has no logic units (skills) assigned.');
    }

    const [run] = await db.insert(employeeRuns).values({
      employeeId,
      userId,
      status: 'pending',
      inputData: { 
        task: task, 
        context: context || {} 
      }
    }).returning();

    if (!run) throw new Error("Failed to initialize employee run record.");

    // Import and build the ReAct reasoning graph
    const { buildEmployeeGraph } = await import('./employee-graph.js');
    const graph = buildEmployeeGraph(employee, userId);

    // Run the graph asynchronously (fire-and-forget, DB tracks status)
    (async () => {
      try {
        const result = await graph.invoke({
          task,
          userId,
          employee,
          groundingData: '',
          messages: [],
          result: null,
          status: 'pending'
        }, { recursionLimit: 50 });

        await db.update(employeeRuns).set({
          status: result.status === 'completed' ? 'completed' : 'failed',
          output: { data: result.result, success: result.status === 'completed' },
          endTime: new Date()
        }).where(eq(employeeRuns.id, run.id));
      } catch (err: any) {
        console.error(`[EmployeeGraph:${run.id}] Execution failed:`, err);
        await db.update(employeeRuns).set({
          status: 'failed',
          output: { error: err.message, success: false },
          endTime: new Date()
        }).where(eq(employeeRuns.id, run.id));
      }
    })();

    return { runId: run.id, status: 'queued', message: `Operative ${employee.name} initialized via Reasoning Graph.` };
  },

  async getRuns(employeeId: string, userId: string) {
    return await db.select({
      id: employeeRuns.id,
      status: employeeRuns.status,
      inputData: employeeRuns.inputData,
      output: employeeRuns.output,
      startTime: employeeRuns.startTime,
      endTime: employeeRuns.endTime,
      skillId: employeeRuns.skillId,
      skillName: skills.name
    })
      .from(employeeRuns)
      .leftJoin(skills, eq(employeeRuns.skillId, skills.id))
      .where(and(eq(employeeRuns.employeeId, employeeId), eq(employeeRuns.userId, userId)))
      .orderBy(desc(employeeRuns.startTime));
  },

  async getMyRuns(userId: string) {
    return await db.select({
      id: employeeRuns.id,
      status: employeeRuns.status,
      inputData: employeeRuns.inputData,
      output: employeeRuns.output,
      startTime: employeeRuns.startTime,
      endTime: employeeRuns.endTime,
      employeeName: employees.name
    })
      .from(employeeRuns)
      .innerJoin(employees, eq(employeeRuns.employeeId, employees.id))
      .where(eq(employeeRuns.userId, userId))
      .orderBy(desc(employeeRuns.startTime));
  },

  async getDashboardStats(userId: string) {
    const eRuns = await db.select().from(employeeRuns).where(eq(employeeRuns.userId, userId));
    const userEmployees = await db.select().from(employees).where(eq(employees.creatorId, userId));
    
    const totalRuns = eRuns.length;
    const activeEntities = userEmployees.length;

    const successfulRuns = eRuns.filter(r => r.status === 'completed').length;
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

    return { 
      totalRuns, 
      activeAgents: activeEntities,
      successRate,
      aiUsage: totalRuns > 0 ? `${(totalRuns * 0.12).toFixed(1)}K` : "0", 
      toolsConnected: 4
    };
  },

  async listPublicDirectory() {
    return await db.select().from(employees)
      .where(eq(employees.isPublished, true))
      .orderBy(desc(employees.updatedAt));
  },

  async getRunDetails(runId: string) {
    const rows = await db.select().from(employeeRuns).where(eq(employeeRuns.id, runId));
    return rows[0];
  }
};
