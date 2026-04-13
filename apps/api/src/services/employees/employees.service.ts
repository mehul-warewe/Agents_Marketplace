import { employees, employeeRuns, skills, eq, and, desc } from '@repo/database';
import { db } from '../../shared/db.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';

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

  async runEmployee(employeeId: string, userId: string, task: string) {
    const employee = await this.getEmployee(employeeId);
    if (!employee) throw new Error('Employee not found');

    // Here, we would eventually implement an LLM router to pick the best skill.
    // For now, if there is only one skill, we run it. If multiple, we might need a router.
    // This phase focuses on the plumbing.
    
    if (employee.skillIds && employee.skillIds.length > 0) {
      const skillId = employee.skillIds[0]; // Simple default for now
      const skill = await db.select().from(skills).where(eq(skills.id, skillId)).then(r => r[0]);
      
      if (!skill) throw new Error('Assigned skill not found');

      const [run] = await db.insert(employeeRuns).values({
        employeeId,
        skillId,
        userId,
        status: 'pending',
        inputData: { task }
      }).returning();

      await executionQueue.add('execute-skill', {
        runId: run.id,
        skillId: skill.id,
        workflow: skill.workflow,
        userId,
        inputData: { task },
        runTable: 'employee_runs'
      });

      return { runId: run.id, status: 'queued', message: `Delegated to ${employee.name}` };
    }

    throw new Error('Employee has no skills assigned');
  },

  async getRuns(employeeId: string, userId: string) {
    return await db.select()
      .from(employeeRuns)
      .where(and(eq(employeeRuns.employeeId, employeeId), eq(employeeRuns.userId, userId)))
      .orderBy(desc(employeeRuns.startTime));
  }
};
