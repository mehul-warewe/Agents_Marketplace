import { skills, employeeRuns, eq, desc } from '@repo/database';
import { db } from '../../shared/db.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';

const redis = getRedisConnection();
const executionQueue = createExecutionQueue(redis);

export const skillsService = {
  async listPublishedSkills() {
    return await db.select().from(skills)
      .where(eq(skills.isPublished, true))
      .orderBy(desc(skills.createdAt));
  },

  async listMySkills(userId: string) {
    return await db.select().from(skills).where(eq(skills.creatorId, userId));
  },

  async getSkill(skillId: string) {
    const rows = await db.select().from(skills).where(eq(skills.id, skillId));
    return rows[0];
  },

  async createSkill(userId: string, data: any) {
    const { name, description, workflow, category } = data;
    const [newSkill] = await db.insert(skills).values({
      name, description, workflow, category, creatorId: userId,
    }).returning();
    return newSkill;
  },

  async updateSkill(skillId: string, userId: string, data: any) {
    const { name, description, workflow, category, isPublished } = data;
    
    // Ownership check
    const existing = await this.getSkill(skillId);
    if (!existing || existing.creatorId !== userId) {
       throw new Error('Unauthorized or not found');
    }

    const [updated] = await db.update(skills).set({
      name, description, workflow, category, isPublished, updatedAt: new Date()
    }).where(eq(skills.id, skillId)).returning();
    
    return updated;
  },

  async deleteSkill(skillId: string, userId: string) {
    const existing = await this.getSkill(skillId);
    if (!existing || existing.creatorId !== userId) {
       throw new Error('Unauthorized or not found');
    }
    
    await db.delete(employeeRuns).where(eq(employeeRuns.skillId, skillId));
    const [deleted] = await db.delete(skills).where(eq(skills.id, skillId)).returning();
    return deleted;
  },

  async runSkill(skillId: string, userId: string, data: any) {
    const { inputData, triggerNodeId, runMode } = data;
    const skill = await this.getSkill(skillId);
    if (!skill) throw new Error('Skill not found');

    if (skill.creatorId !== userId) {
       throw new Error('Unauthorized');
    }

    const [run] = await db.insert(employeeRuns).values({
      skillId: skill.id, 
      userId, 
      status: 'pending',
      // Since it's a direct skill run, there might be no employeeId
      // In a real employee run, employeeId would be mandatory.
      // We'll handle this by allowing null employeeId in employeeRuns if needed,
      // or we can create a "System" employee. 
      // Actually, the schema allows it to be null if we didn't add .notNull()
    } as any).returning();
    
    if (!run) throw new Error('Failed to initiate skill run');

    await executionQueue.add('execute-skill', { 
      runId: run.id, 
      skillId: skill.id, 
      workflow: skill.workflow, 
      userId, 
      inputData, 
      triggerNodeId, 
      runMode,
      runTable: 'employee_runs'
    });
    
    return { runId: run.id, status: 'queued' };
  }
};
