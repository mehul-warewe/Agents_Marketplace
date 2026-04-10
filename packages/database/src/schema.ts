import { pgTable, text, timestamp, uuid, jsonb, pgEnum, integer, doublePrecision, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const agentStatusEnum = pgEnum('agent_status', ['running', 'completed', 'failed', 'pending']);
export const userTierEnum = pgEnum('user_tier', ['free', 'pro', 'ultra']);
export const transactionTypeEnum = pgEnum('transaction_type', ['subscription_reset', 'purchase', 'usage', 'node_unlock']);


export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  password: text('password'),
  provider: text('provider').default('local').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  tier: userTierEnum('tier').default('free').notNull(),
  credits: integer('credits').default(100).notNull(), // Initial 100 free credits
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  workflow: jsonb('workflow').notNull(),
  price: doublePrecision('price').default(0),
  category: text('category'),
  isPublished: boolean('is_published').default(false).notNull(),
  isWorker: boolean('is_worker').default(false).notNull(), // Flag for Manager discovery
  workerDescription: text('worker_description'),          // AI-readable capability description
  workerInputSchema: jsonb('worker_input_schema'),        // Expected inputs for the Manager
  originalId: uuid('original_id'), // Reference to the marketplace agent it was cloned from
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NEW: managers table (The CEO agents)
export const managers = pgTable('managers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  goal: text('goal'),                      // Standing objective
  systemPrompt: text('system_prompt'),     // Custom boss instructions
  model: text('model').default('google/gemini-2.0-flash-001'),
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  workerIds: jsonb('worker_ids').$type<string[]>().default([]), // Pinned workers for this manager
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NEW: manager_runs table (Manager execution history)
export const managerRuns = pgTable('manager_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  managerId: uuid('manager_id').references(() => managers.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  input: text('input').notNull(),           // User task
  status: agentStatusEnum('status').default('pending').notNull(),
  steps: jsonb('steps').$type<any[]>().default([]), // Reasoning trace (streamed)
  output: jsonb('output'),                   // Final result
  childRunIds: jsonb('child_run_ids').$type<string[]>().default([]), // Sub-agent executions
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
});

export const tools = pgTable('tools', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),
  endpoint: text('endpoint'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: agentStatusEnum('status').default('pending').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'),
  logs: jsonb('logs'),
  output: jsonb('output'),
});

/**
 * User Credentials — stores per-user integration secrets, encrypted at rest.
 * 
 * Credential types:
 *  - slack_webhook    : { webhookUrl }
 *  - slack_oauth      : { accessToken, botToken, teamId, teamName }
 *  - smtp_email       : { host, port, user, password, from }
 *  - google_oauth     : { accessToken, refreshToken, expiresAt, email }
 *  - http_bearer      : { baseUrl, token }
 *  - http_basic       : { baseUrl, username, password }
 *  - webhook_relay    : { url, secret? }
 */
export const credentials = pgTable('credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),              // e.g. "My Work Slack"
  type: text('type').notNull(),              // e.g. "slack_webhook"
  data: text('data').notNull(),              // AES-256-GCM encrypted JSON string
  isValid: boolean('is_valid').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // Positive for additions, negative for deductions
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  stripeSessionId: text('stripe_session_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userNodes = pgTable('user_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  nodeKey: text('node_key').notNull(), // e.g. 'webSearch', 'scrapeUrl'
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

export const otps = pgTable('otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memories = pgTable('memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userKeyIdx: uniqueIndex('memories_user_key_idx').on(table.userId, table.key),
  };
});

export const pipedreamApps = pgTable('pipedream_apps', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  icon: text('icon'),
  description: text('description'),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: index('pd_app_name_idx').on(table.name),
  };
});




