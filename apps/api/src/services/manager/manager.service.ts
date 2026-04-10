import { managers, managerRuns, eq, desc, and } from '@repo/database';
import { db } from '../../shared/db.js';

export const managerService = {
  async listManagers(userId: string) {
    return await db.select().from(managers).where(eq(managers.creatorId, userId)).orderBy(desc(managers.updatedAt));
  },

  async getManager(managerId: string) {
    const rows = await db.select().from(managers).where(eq(managers.id, managerId));
    return rows[0];
  },

  async createManager(userId: string, data: any) {
    const { name, description, goal, systemPrompt, model, workerIds } = data;
    const [newManager] = await db.insert(managers).values({
      name,
      description,
      goal,
      systemPrompt,
      model: model || 'google/gemini-2.0-flash-001',
      creatorId: userId,
      workerIds: workerIds || [],
    }).returning();
    return newManager;
  },

  async updateManager(managerId: string, userId: string, data: any) {
    const existing = await this.getManager(managerId);
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }

    const { name, description, goal, systemPrompt, model, workerIds, isPublished } = data;
    const [updated] = await db.update(managers).set({
      name: name ?? existing.name,
      description: description ?? existing.description,
      goal: goal ?? existing.goal,
      systemPrompt: systemPrompt ?? existing.systemPrompt,
      model: model ?? existing.model,
      workerIds: workerIds ?? existing.workerIds,
      isPublished: isPublished ?? existing.isPublished,
      updatedAt: new Date()
    }).where(eq(managers.id, managerId)).returning();
    
    return updated;
  },

  async deleteManager(managerId: string, userId: string) {
    const existing = await this.getManager(managerId);
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Unauthorized or not found');
    }
    
    const [deleted] = await db.delete(managers).where(eq(managers.id, managerId)).returning();
    return deleted;
  },

  async getManagerRuns(managerId: string, userId: string) {
    return await db.select().from(managerRuns)
      .where(and(eq(managerRuns.managerId, managerId), eq(managerRuns.userId, userId)))
      .orderBy(desc(managerRuns.startTime));
  },

  async getManagerRun(runId: string) {
    const rows = await db.select().from(managerRuns).where(eq(managerRuns.id, runId));
    return rows[0];
  }
};
