import { skills, employeeRuns, eq, desc, sql, and } from '@repo/database';
import { db } from '../../shared/db.js';
import { createExecutionQueue, getRedisConnection } from '@repo/queue';

const redis = getRedisConnection();
const executionQueue = createExecutionQueue(redis);

export const skillsService = {
  async listPublishedSkills() {
    // SECURITY: Only return metadata for the marketplace. No internal logic (workflow)
    // is revealed until the skill is actually cloned/purchased.
    return await db.select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      category: skills.category,
      price: skills.price,
      inputSchema: skills.inputSchema,
      outputDescription: skills.outputDescription,
      creatorId: skills.creatorId,
      updatedAt: skills.updatedAt,
      // We reveal required credentials so users know what they need before buying
      required_credentials: sql<any>`${skills.workflow}->'requiredCredentials'`,
    }).from(skills)
      .where(eq(skills.isPublished, true))
      .orderBy(desc(skills.createdAt));
  },

  async listMySkills(userId: string) {
    const originalSkills = sql`original_skills`;
    return await db.select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      category: skills.category,
      isPublished: skills.isPublished,
      inputSchema: skills.inputSchema,
      outputDescription: skills.outputDescription,
      workflow: skills.workflow,
      updatedAt: skills.updatedAt,
      createdAt: skills.createdAt,
      nodeCount: sql<number>`
        CASE 
          WHEN jsonb_typeof(${skills.workflow}->'nodes') = 'array' THEN jsonb_array_length(${skills.workflow}->'nodes')
          WHEN jsonb_typeof(${skills.workflow}) = 'array' THEN jsonb_array_length(${skills.workflow})
          ELSE 0 
        END`,
      required_credentials: sql<any>`${skills.workflow}->'requiredCredentials'`,
      originalId: skills.originalId,
      originalVersion: skills.originalVersion,
      latestVersion: sql<number>`COALESCE(os.version, 1)`,
      hasUpdate: sql<boolean>`COALESCE(os.version > ${skills.originalVersion}, false)`
    })
      .from(skills)
      .leftJoin(sql`skills as os`, eq(skills.originalId, sql`os.id`))
      .where(eq(skills.creatorId, userId))
      .orderBy(desc(skills.updatedAt));
  },

  async getSkill(skillId: string) {
    const rows = await db.select().from(skills).where(eq(skills.id, skillId));
    return rows[0];
  },

  async createSkill(userId: string, data: any) {
    const { name, description, workflow, category, inputSchema, outputDescription } = data;
    
    // Extract credential requirements manifest
    const nodes = workflow?.nodes || [];
    const requiredCredentials = nodes
      .filter((n: any) => n.data?.config?.credentialId)
      .map((n: any) => ({
        nodeId: n.id,
        nodeLabel: n.data?.label || 'Node',
        provider: n.data?.executionKey?.split('_')[0] || 'unknown'
      }));

    const [newSkill] = await db.insert(skills).values({
      name, description, 
      workflow: { ...workflow, requiredCredentials }, 
      category, creatorId: userId,
      inputSchema: inputSchema || [],
      outputDescription: outputDescription || null,
    }).returning();
    return newSkill;
  },

  async updateSkill(skillId: string, userId: string, data: any) {
    const { name, description, workflow, category, isPublished, inputSchema, outputDescription } = data;
    
    const existing = await this.getSkill(skillId);
    if (!existing || existing.creatorId !== userId) {
       throw new Error('Unauthorized or not found');
    }

    // Update manifest if workflow changed
    let finalWorkflow = workflow || existing.workflow;
    if (workflow) {
      const nodes = workflow.nodes || [];
      const requiredCredentials = nodes
        .filter((n: any) => n.data?.config?.credentialId)
        .map((n: any) => ({
          nodeId: n.id,
          nodeLabel: n.data?.label || 'Node',
          provider: n.data?.executionKey?.split('_')[0] || 'unknown'
        }));
      finalWorkflow = { ...workflow, requiredCredentials };
    }

    const [updated] = await db.update(skills).set({
      name, description, workflow: finalWorkflow, category, isPublished, updatedAt: new Date(),
      inputSchema: inputSchema !== undefined ? inputSchema : existing.inputSchema,
      outputDescription: outputDescription !== undefined ? outputDescription : existing.outputDescription,
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
      inputData: inputData || {},
      startTime: new Date(),
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
  },

  async cloneSkill(skillId: string, userId: string) {
    const skill = await this.getSkill(skillId);
    if (!skill || !skill.isPublished) throw new Error('Skill not found or not published');
    
    // Check if the user is cloning their own skill (free)
    const isOwner = skill.creatorId === userId;

    if (!isOwner) {
      const alreadyOwned = await db.select().from(skills).where(
        and(
           eq(skills.creatorId, userId),
           eq(skills.originalId, skillId)
        )
      );
      if (alreadyOwned.length > 0) throw new Error('You have already purchased this skill unit.');

      // Transactional Purchase
      if (skill.price && skill.price > 0) {
        console.log(`[SKILLS_SERVICE] Attempting deduction for ${userId}: ${skill.price} credits for skill ${skill.id}`);
        const { billingService } = await import('../billing/billing.service.js');
        const result = await billingService.deductCredits(userId, skill.price, `Purchase Skill: ${skill.name}`);
        console.log(`[SKILLS_SERVICE] Deduction result:`, result);
        if (!result.success) throw new Error(result.error || 'Purchase failed');
      }
    }

    // SECURITY: Scrub all credentialIds and internal user references from the workflow
    const rawWorkflow = JSON.parse(JSON.stringify(skill.workflow));
    if (rawWorkflow.nodes) {
      rawWorkflow.nodes = rawWorkflow.nodes.map((n: any) => ({
        ...n,
        data: {
          ...n.data,
          config: {
            ...n.data?.config,
            credentialId: null // Scrub private key
          }
        }
      }));
    }

    const [cloned] = await db.insert(skills).values({
      name: isOwner ? `Copy of ${skill.name}` : skill.name,
      description: skill.description,
      creatorId: userId,
      workflow: rawWorkflow,
      inputSchema: skill.inputSchema,
      outputDescription: skill.outputDescription,
      isPublished: false,
      originalId: isOwner ? null : skillId,
      originalVersion: isOwner ? null : skill.version, // Track the version at time of clone
      category: skill.category,
      price: 0, // Cloned version is private and free for the owner
    }).returning();
    return cloned;
  },

  async updateFromOriginal(skillId: string, userId: string) {
    const existing = await this.getSkill(skillId);
    if (!existing || existing.creatorId !== userId) {
      throw new Error('Skill not found or unauthorized');
    }

    if (!existing.originalId) {
      throw new Error('This is an original skill, not a clone.');
    }

    const original = await this.getSkill(existing.originalId);
    if (!original || !original.isPublished) {
      throw new Error('The original marketplace skill is no longer available.');
    }

    // Replace workflow and logic with the latest version
    const [updated] = await db.update(skills).set({
      workflow: original.workflow,
      inputSchema: original.inputSchema,
      outputDescription: original.outputDescription,
      originalVersion: original.version,
      updatedAt: new Date()
    }).where(eq(skills.id, skillId)).returning();

    return updated;
  },

  async publishSkill(skillId: string, userId: string, data: any) {
    const { published, category, price } = data;
    const existing = await this.getSkill(skillId);
    if (!existing || existing.creatorId !== userId) throw new Error('Unauthorized');

    // STRUCTURAL AUDIT: Verify Skill has Input and Output gateways before public release
    if (published !== false) {
      const wf = existing.workflow as any;
      const nodes = wf?.nodes || [];
      const hasInput = nodes.some((n: any) => n.data?.toolId === 'skill.input');
      const hasOutput = nodes.some((n: any) => n.data?.toolId === 'skill.output');
      
      if (!hasInput || !hasOutput) {
        throw new Error('Skill must have both an Input and an Output node before it can be published.');
      }
    }

    const [updated] = await db.update(skills).set({
      isPublished: published === undefined ? true : !!published,
      category: category || existing.category,
      price: price !== undefined ? price : existing.price,
      version: existing.version + 1, // Whenever we publish/update marketplace settings, we bump version
      updatedAt: new Date()
    }).where(eq(skills.id, skillId)).returning();
    return updated;
  },
  /**
   * Invoke a skill as a synchronous tool call — used by the Employee ReAct loop.
   * Queues the job, polls the DB, and returns a structured { data, success } result.
   */
  async invokeSkillAsToolSync(
    skillId: string,
    userId: string,
    inputData: Record<string, any>,
    timeoutMs = 60_000
  ): Promise<{ data: any; success: boolean; error?: string }> {
    const { runId } = await this.runSkill(skillId, userId, { inputData });

    const deadline = Date.now() + timeoutMs;
    // Exponential backoff: 500ms → 1s → 2s → 4s → cap at 8s
    // Reduces DB hammering from the agent loop while still being responsive.
    let pollInterval = 500;
    const MAX_POLL_INTERVAL = 8_000;

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, pollInterval));
      pollInterval = Math.min(pollInterval * 2, MAX_POLL_INTERVAL);

      const rows = await db.select({
        id: employeeRuns.id,
        status: employeeRuns.status,
        output: employeeRuns.output,
      }).from(employeeRuns).where(eq(employeeRuns.id, runId));
      const run = rows[0];

      if (run?.status === 'completed') {
        const output = run.output as any;
        return output?.success === false
          ? { data: null, success: false, error: output.error }
          : { data: output?.data ?? output, success: true };
      }
      if (run?.status === 'failed') {
        const output = run.output as any;
        return { data: null, success: false, error: output?.error || 'Skill execution failed' };
      }
    }

    return { data: null, success: false, error: `Skill timed out after ${timeoutMs / 1000}s` };
  }
};
