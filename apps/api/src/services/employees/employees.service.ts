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
    const knowledgeIds = (employee as any).knowledgeIds || [];

    if (skillIds.length === 0) {
      throw new Error('Employee has no logic units (skills) assigned.');
    }

    // 1. RAG Grounding (Relevance AI Knowledge Style)
    let groundingData = "";
    if (knowledgeIds.length > 0) {
       const relevantInfo = await knowledgeService.searchKnowledge(userId, task, knowledgeIds);
       if (relevantInfo.length > 0) {
          groundingData = relevantInfo.map(k => `[Title: ${k.title}]\n${k.content}`).join('\n---\n');
          context.grounding_facts = relevantInfo;
       }
    }

    // 2. Fetch assigned skills metadata
    const assignedSkills = await db.select().from(skills).where(inArray(skills.id, skillIds));
    
    // 3. LLM Recommendation / Routing
    let selectedSkillId = skillIds[0];
    let refinedTask = task;

    if (assignedSkills.length > 1) {
      const model = new ChatOpenAI({
        modelName: employee.model || 'google/gemini-2.0-flash-001',
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature: 0,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
        },
      });

      const skillContext = assignedSkills.map(s => {
        const instr = employee.skillInstructions?.[s.id] || '';
        return `ID: ${s.id}\nName: ${s.name}\nDecription: ${s.description}\nInstructions: ${instr}`;
      }).join('\n---\n');

      const prompt = `You are the dispatcher for an AI Operative named "${employee.name}".
Your job is to read the user's task and select the BEST skill from the list below to handle it.

USER TASK: "${task}"
${groundingData ? `\nGROUNDING KNOWLEDGE PRE-FETCHED:\n${groundingData}\n` : ''}
${context ? `PRIOR MISSION CONTEXT: ${JSON.stringify(context)}` : ''}

AVAILABLE SKILLS:
${skillContext}

RESPONSE FORMAT:
Return ONLY a JSON object with two fields:
"skillId": The UUID of the chosen skill.
"input": A refined version of the task. Use GROUNDING KNOWLEDGE to be more specific.

JSON:`;

      try {
        const response: any = await model.invoke(prompt);
        const text = response.content as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.skillId && skillIds.includes(parsed.skillId)) {
            selectedSkillId = parsed.skillId;
            refinedTask = parsed.input || task;
          }
        }
      } catch (err) {
        console.error('[EmployeeRouter] Routing failed:', err);
      }
    }

    const skill = assignedSkills.find(s => s.id === selectedSkillId);
    if (!skill) throw new Error('Selected skill not found');

    const [run] = await db.insert(employeeRuns).values({
      employeeId,
      skillId: selectedSkillId,
      userId,
      status: 'pending',
      inputData: { 
        task: refinedTask, 
        originalTask: task,
        context: context || {} 
      }
    }).returning();

    await executionQueue.add('execute-skill', {
      runId: run.id,
      skillId: skill.id,
      workflow: skill.workflow,
      userId,
      inputData: { ...context, task: refinedTask },
      runTable: 'employee_runs'
    });

    return { runId: run.id, status: 'queued', message: `Operative ${employee.name} initialized on protocol: ${skill.name}` };
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
  }
};
