import '../src/loadenv.js';
import { db } from '../src/shared/db.js';
import { users, skills, employees, managers, managerRuns, eq, and } from '@repo/database';
import { managerEngine } from '../src/services/manager/manager-engine.js';
import { log } from '../src/shared/logger.js';

async function test3TierSystem() {
    log.info('🚀 Starting 3-Tier System Integration Test...');

    // 1. Get a test user
    const [testUser] = await db.select().from(users).limit(1);
    if (!testUser) {
        log.error('❌ No user found in database. Run the app and sign up first.');
        process.exit(1);
    }
    const userId = testUser.id;
    log.info(`Using user: ${testUser.email}`);

    // 2. Create a Test Skill (Tier 1)
    // This skill just uses an AI node to synthesize information
    const [testSkill] = await db.insert(skills).values({
        name: "Information Synthesis Skill",
        description: "Summarizes complex data points into actionable insights",
        creatorId: userId,
        category: "Research",
        workflow: {
            nodes: [
                { id: 'n1', data: { label: 'Start', toolId: 'trigger.manual', config: {} }, position: { x: 0, y: 0 } },
                { id: 'n2', data: { label: 'AI Summarizer', toolId: 'ai.llm', config: { systemPrompt: "Summarize precisely.", userMessage: "{{ input }}" } }, position: { x: 300, y: 0 } }
            ],
            edges: [
                { id: 'e1', source: 'n1', sourceHandle: 'output', target: 'n2', targetHandle: 'Input' }
            ]
        }
    }).returning();
    log.info(`✅ Skill Created: ${testSkill.name}`);

    // 3. Create a Test Employee (Tier 2) - "The Researcher"
    const [testEmployee] = await db.insert(employees).values({
        name: "Research Operative X",
        description: "Specializes in deep research and data synthesis",
        avatar: "🕵️",
        systemPrompt: "You are a precise data researcher. You focus on factual accuracy and hierarchical summaries.",
        creatorId: userId,
        skillIds: [testSkill.id],
        skillInstructions: {
            [testSkill.id]: "Use this whenever you need to boil down information for the management."
        }
    }).returning();
    log.info(`✅ Employee Created: ${testEmployee.name}`);

    // 4. Create a Test Manager (Tier 3) - "The Strategy Lead"
    const [testManager] = await db.insert(managers).values({
        name: "Strategy Boss",
        description: "Oversees research missions and provides strategic direction",
        goal: "Convert raw research into a 3-point business strategy",
        systemPrompt: "You are the head of strategy. You delegate research tasks to operatives and combine their findings into high-level business plans.",
        creatorId: userId,
        employeeIds: [testEmployee.id]
    }).returning();
    log.info(`✅ Manager Created: ${testManager.name}`);

    // 5. Run the System
    const task = "Research the current state of AI Agents in 2025 and give me a strategy.";
    log.info(`🏃 Triggering Manager with Task: "${task}"`);

    const runId = await managerEngine.runManager(testManager.id, userId, task, (step) => {
        // This callback logs the "Thoughts" of the agents as they work
        if (step.type === 'init') {
            log.info(`[System] Run Initialized: ${step.runId}`);
        } else if (step.thought) {
            log.info(`[Agent Thought] ${step.thought}`);
        } else if (step.type === 'employee_called') {
            log.info(`[Delegation] ➡️ Calling Employee ${step.employeeId} (Run: ${step.runId})`);
        } else if (step.type === 'employee_done') {
             log.info(`[Result] ⬅️ Employee responded.`);
        }
    });

    // 6. Monitor for completion
    log.info('⏳ Monitoring run progress...');
    
    let isDone = false;
    while (!isDone) {
        const [run] = await db.select().from(managerRuns).where(eq(managerRuns.id, runId));
        if (run.status === 'completed') {
            log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            log.info('🏁 MISSION COMPLETE');
            log.info('FINAL STRATEGY OUTPUT:');
            console.log(run.output);
            log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            isDone = true;
        } else if (run.status === 'failed') {
            log.error('❌ Mission Failed');
            console.error(run.output);
            isDone = true;
        } else {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // Cleanup (Optional)
    // await db.delete(managers).where(eq(managers.id, testManager.id));
    // await db.delete(employees).where(eq(employees.id, testEmployee.id));
    // await db.delete(skills).where(eq(skills.id, testSkill.id));

    process.exit(0);
}

test3TierSystem().catch(err => {
    log.error('Test script failed:', err);
    process.exit(1);
});
