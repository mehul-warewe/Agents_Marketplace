# warewe

A powerful, credit-based AI agent platform and marketplace built with a modern monorepo architecture. Users can build autonomous agents using a node-based interface, run them using credits, and publish them to a global marketplace.

## 🚀 Key Features

-   **Autonomous Agent Builder**: Drag-and-drop node-based interface to design complex agent workflows.
-   **Tiered Pricing System**: Three subscription tiers (Free, Pro, Ultra) with monthly credit allowances.
-   **Persistent Credit System**: Purchase one-time credit packs that never expire, independent of subscription tiers.
-   **Agent Marketplace**: Discover, use, and publish AI agents with category and pricing management.
-   **Stripe Integration**: Secure checkout for both monthly subscriptions and one-time credit top-ups.
-   **Scalable Architecture**: Worker-based execution using BullMQ for reliable agent runs.

## 🛠 Tech Stack

-   **Monorepo**: [Turborepo](https://turbo.build/repo)
-   **Frontend**: [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/)
-   **Backend**: [Express.js](https://expressjs.com/), [Passport.js](https://www.passportjs.org/) (Google OAuth & Local Auth)
-   **Worker/Queue**: [BullMQ](https://docs.bullmq.io/), Redis
-   **Database**: [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/)
-   **Payments**: [Stripe API](https://stripe.com/docs/api)

## 📦 Project Structure

```text
├── apps/
│   ├── api/        # Express API server
│   ├── web/        # Next.js frontend
│   └── worker/     # Agent execution engine
├── packages/
│   ├── database/   # Shared Drizzle schema & client
│   ├── queue/      # BullMQ configurations
│   ├── ui/         # Shared UI components
│   └── typescript-config/ # Shared TS configs
```

## 🚥 Getting Started

### Prerequisites

-   **Node.js** (v18+)
-   **pnpm** (preferred package manager)
-   **Docker** (for Redis and Postgres)
-   **Stripe CLI** (for local webhook testing)

### Installation

1.  Clone the repository
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Set up your environment variables:
    ```bash
    cp .env.example .env
    # Fill in the required keys (OpenRouter, Google OAuth, Stripe)
    ```

### Database Setup

Initialize your database schema:
```bash
cd packages/database
pnpm run db:push
pnpm run db:setup
```

### Stripe Configuration

To test payments locally:
1.  Log in to Stripe CLI: `stripe login`
2.  Start the webhook listener:
    ```bash
    stripe listen --forward-to localhost:3001/billing/webhook
    ```
3.  Copy the `webhook signing secret` into your `.env` as `STRIPE_WEBHOOK_SECRET`.

### Running the Project

Start all services in development mode:
```bash
pnpm dev
```

The apps will be available at:
-   **Frontend**: http://localhost:3000
-   **API**: http://localhost:3001

## 📄 License

warewe
