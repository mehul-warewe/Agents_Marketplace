import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from "../apps/api/src/shared/db.js";
import { users, skills, employees, managers, managerRuns, eq } from "@repo/database";
import { managerEngine } from "../apps/api/src/services/manager/manager-engine.js";

async function runFinalTest() {
  console.log("🌟 FINAL SYSTEM TEST: THREE-TIER AGENTIC ARCHITECTURE 🌟");
  console.log("-------------------------------------------------------");

  const [user] = await db.select().from(users).limit(1);
  const userId = user.id;

  const codeSkillId = uuidv4();
  await db.insert(skills).values({
    id: codeSkillId,
    name: "System Reporter Tool",
    description: "Generates a health report.",
    creatorId: userId,
    workflow: {
      nodes: [
        { id: '1', type: 'input', data: { label: 'Input' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'logic', data: { label: 'Report Generator', executionKey: 'logic_code', config: { code: "return { status: 'OK', performance: 'Optimal' };" } }, position: { x: 200, y: 0 } },
        { id: '3', type: 'output', data: { label: 'Output', executionKey: 'skill_output' }, position: { x: 400, y: 0 } }
      ],
      edges: [{ id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }]
    },
    inputSchema: [],
    outputDescription: "Health JSON"
  });

  const specialistId = uuidv4();
  await db.insert(employees).values({
    id: specialistId,
    name: "System Auditor",
    description: "Analyzes system health.",
    systemPrompt: "You are the System Auditor. Use your reporter tool and summarize results.",
    model: "google/gemini-2.0-flash-001",
    skillIds: [codeSkillId],
    creatorId: userId
  });

  const managerId = uuidv4();
  const [manager] = await db.insert(managers).values({
    id: managerId,
    name: "Project CEO",
    goal: "Maintain system awareness.",
    systemPrompt: "You are the CEO. Delegate to Auditor.",
    model: "google/gemini-2.0-flash-001",
    employeeIds: [specialistId],
    creatorId: userId
  }).returning();

  console.log(`✅ Test Environment Ready.`);

  const task = "CEO, run a system audit.";
  const runId = await managerEngine.runManager(manager.id, userId, task, (step) => {
    if (step.action) console.log(`👉 [EVENT]: ${step.action}`);
  });

  console.log(`⏳ Processing (ID: ${runId})...`);

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const runs = await db.select().from(managerRuns).where(eq(managerRuns.id, runId));
    if (runs[0]?.status === 'completed') {
      console.log(`\n🏁 FINAL RESPONSE:\n${JSON.stringify(runs[0].output, null, 2)}`);
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  process.exit(1);
}

runFinalTest().catch(console.error);
