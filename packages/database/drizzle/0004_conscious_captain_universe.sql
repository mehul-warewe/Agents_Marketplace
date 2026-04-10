CREATE TABLE IF NOT EXISTS "manager_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manager_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"input" text NOT NULL,
	"status" "agent_status" DEFAULT 'pending' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"output" jsonb,
	"child_run_ids" jsonb DEFAULT '[]'::jsonb,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"goal" text,
	"system_prompt" text,
	"model" text DEFAULT 'google/gemini-2.0-flash-001',
	"creator_id" uuid NOT NULL,
	"worker_ids" jsonb DEFAULT '[]'::jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipedream_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"description" text,
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_runs" DROP CONSTRAINT "agent_runs_agent_id_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "is_worker" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "worker_description" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "worker_input_schema" jsonb;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pd_app_name_idx" ON "pipedream_apps" ("name");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manager_runs" ADD CONSTRAINT "manager_runs_manager_id_managers_id_fk" FOREIGN KEY ("manager_id") REFERENCES "managers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "manager_runs" ADD CONSTRAINT "manager_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "managers" ADD CONSTRAINT "managers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
