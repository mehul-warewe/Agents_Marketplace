import { pgTable, text, uuid, timestamp, jsonb, boolean, integer, doublePrecision, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password'),
  avatarUrl: text('avatar_url'),
  provider: text('provider').notNull(),
  credits: integer('credits').default(100).notNull(),
  tier: text('tier').default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  workflow: jsonb('workflow').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  isWorker: boolean('is_worker').default(false).notNull(),
  workerDescription: text('worker_description'),
  workerInputSchema: jsonb('worker_input_schema'),
  category: text('category'),
  price: doublePrecision('price').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').references(() => agents.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: text('status').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'),
  logs: jsonb('logs'),
  output: jsonb('output'),
});

export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  workflow: jsonb('workflow').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  category: text('category'),
  version: integer('version').default(1).notNull(),
  inputSchema: jsonb('input_schema').default([]),
  outputDescription: text('output_description'),
  price: doublePrecision('price').default(0),
  originalId: uuid('original_id'),
  originalVersion: integer('original_version'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  avatar: text('avatar'),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  systemPrompt: text('system_prompt'),
  model: text('model'),
  skillIds: jsonb('skill_ids').default([]),
  skillInstructions: jsonb('skill_instructions').default({}),
  knowledgeIds: jsonb('knowledge_ids').default([]),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeRuns = pgTable('employee_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  skillId: uuid('skill_id').references(() => skills.id),
  status: text('status').notNull(),
  inputData: jsonb('input_data'),
  output: jsonb('output'),
  steps: jsonb('steps'),
  duration: integer('duration'),
  logs: jsonb('logs'),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
});

export const managers = pgTable('managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  goal: text('goal'),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  systemPrompt: text('system_prompt'),
  model: text('model'),
  employeeIds: jsonb('employee_ids').default([]),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const managerRuns = pgTable('manager_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  managerId: uuid('manager_id').references(() => managers.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: text('status').notNull(),
  inputData: jsonb('input_data'),
  output: jsonb('output'),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
});

export const knowledge = pgTable('knowledge', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tools = pgTable('tools', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  endpoint: text('endpoint'),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const credentials = pgTable('credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  data: text('data').notNull(),
  isValid: boolean('is_valid').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const otps = pgTable('otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  stripeSessionId: text('stripe_session_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memories = pgTable('memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userNodes = pgTable('user_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  nodeKey: text('node_key').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

export const pipedreamApps = pgTable('pipedream_apps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  icon: text('icon'),
  lastSyncedAt: timestamp('last_synced_at'),
});

export const pipedreamComponents = pgTable('pipedream_components', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  appKey: text('app_key'),
  appId: text('app_id'),
  appName: text('app_name'),
  appIcon: text('app_icon'),
  raw: jsonb('raw'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
