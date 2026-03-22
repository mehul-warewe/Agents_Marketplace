# Project Memory: warewe

## 🚀 Overview
**warewe** is an autonomous AI Agent Marketplace and Orchestration Hub. It provides a node-based visual interface for designing, deploying, and monetizing intelligent agent workflows.

### Core Value Proposition
- **Autonomous Architecting**: Converts natural language prompts into executable node-based workflows.
- **Unified Logic Hub**: Orchestrates disparate tools (Search, Scrape, LLM, Webhooks) into cohesive sequences.
- **Economic Scale**: Credit-based execution model with tiered subscriptions and top-up packs.

---
rules:never hardcode anything
    always use variables


## 🛠 Project Architecture (PNPM Workspaces)

### 1. Frontend (`apps/web`)
- **Framework**: Next.js 16 (App Router).
- **Core Dependencies**:
  - `reactflow`: Powering the visual agent builder.
  - `@tanstack/react-query`: Managing server state and real-time polling for agent runs.
  - `zustand`: Global store for auth and UI state.
  - `next-themes`: Handling Light/Dark mode transitions.
  - `framer-motion` & `gsap`: Premium micro-animations.
  - `axios`: API client (configured in `src/lib/api.ts`).
- **Styling**: Vanilla CSS utilizing a custom "Aether" design system tokens in `globals.css`. Limited use of Tailwind (mostly for layout utilities).
- **Branding**: Logos and references updated to **warewe** in `LandingNavbar`, `SidebarLayout`, `AuthModal`, etc.

### 2. Backend API (`apps/api`)
- **Framework**: Express.js (TypeScript).
- **Key Modules**:
  - `auth.ts`: JWT & Google OAuth strategies using `passport`.
  - `localAuth.ts`: OTP-based email authentication (uses `nodemailer`).
  - `agents.ts`: Management of agents, marketplace publication, and workflow architecting via OpenRouter (Gemini).
  - `billing.ts`: Stripe integration for subscriptions (`pro`, `ultra`) and credit packs (`500`, `1200`, `2500`).
  - `credentials.ts`: Secure management of user integration secrets.
- **Security**: AES-256-GCM encryption for credential storage; rate limiting on API endpoints and agent execution triggers.

### 3. Worker Service (`apps/worker`)
- **Engine**: `BullMQ` for job queue processing.
- **Workflow Execution**:
  - Resolves node order via topological BFS.
  - Executes tools sequentially with a shared data context (`ctx`).
  - Logic includes HTTP requests, Web searching, Scraping (Cheerio), LLM Synthesis, and conditional branching (If/Switch/Loop).
- **Context Handling**: Supports `{{ variable }}` template rendering for dynamic data passing between nodes.

### 4. Shared Packages (`packages/*`)
- **`@repo/database`**: PostgreSQL schema defined with `Drizzle ORM`. Handles users, agents, runs, transactions, and credentials.
- **`@repo/queue`**: Centralized BullMQ queue configuration and Redis connection factory.
- **`@repo/typescript-config`**: Shared `tsconfig.json` configurations.
- **`@repo/eslint-config`**: Standardized linting rules across the monorepo.

---

## 📊 Database Schema & Data Models

- **`users`**: Email (unique), tier (`free`, `pro`, `ultra`), credits (default 100), Stripe identifiers.
- **`agents`**: `workflow` (JSONB), `price` (double), `isPublished` (boolean), `creatorId`.
- **`agent_runs`**: `status` (pending/running/completed/failed), `logs` (JSONB), `output` (JSONB).
- **`credentials`**: Encrypted `data` string, `type` (slack, smtp, google, http), `userId`.
- **`transactions`**: Credit ledger tracking purchases and usage.
- **`otps`**: Temporary 6-digit codes for email authentication.

---

## 💳 Billing & Economy

### Subscriptions (Monthly Credits)
- **Free**: 100 base credits.
- **Pro**: 1,500 credits.
- **Ultra**: 5,000 credits.

### Credit Top-ups (One-time)
- Managed via Stripe Checkout.
- Credits are added to the user's persistent balance.
- **Cost**: Currently fixed deduction per run (5 credits), though node-specific costs are planned.

---

## 🎨 Design & Branding Rules

- **Brand Name**: **warewe** (Always lowercase in visual branding).
- **Design System**: "Aether Premium".
- **Visual Palette**: High-contrast dark backgrounds, primary accent `#d4ff3f` (warewe Lime), and sharp/geometric corners.
- **Consistency**: All new components must use CSS variables from `globals.css` and follow the `SidebarLayout` / `Builder` aesthetic.

---

## 🚥 Operational Notes

- **Start Sequence**: Requires local Docker containers for `PostgreSQL` and `Redis`.
- **Webhooks**: Stripe CLI must be running and forwarded to `:3001/billing/webhook` for successful payment processing.
- **AI Connectivity**: Uses `OpenRouter` as the primary LLM proxy. Requires `OPENROUTER_API_KEY`.
- **Queue Management**: Redis (v7) is the backbone for `BullMQ`.

---

## ✅ Ongoing Progress

- [x] Initial monorepo setup (PNPM Workspaces).
- [x] OTP & Google OAuth Authentication.
- [x] Visual Builder with 15 functional node types.
- [x] AI-powered Agent Architect.
- [x] Credit & Billing system (Stripe).
- [x] Global branding update to **warewe**.
- [ ] Implement Dashboard Usage Statistics charts.
- [ ] Add "History" view for individual agent runs.
- [ ] Real-time job status updates via WebSockets.



