# Admin Dashboard

A Next.js 14 + Refine-powered dashboard that ships with OAuth, real-time GraphQL updates, and a Vercel-ready deployment profile.

## Overview
- Next.js app router hosts the Refine SPA shell so routing stays compatible with React Router while working on Vercel.
- Zod-backed env validation guards startup and centralizes runtime configuration for API, OAuth, and feature flags.
- Authentication is managed by NextAuth with secure cookie sessions bridged into the Refine auth provider.
- Realtime data flows through the Refine live provider (GraphQL over WebSocket) with optimistic updates for Kanban, dashboard totals, and CRM metrics.
- Global error boundary and logging utilities surface uncaught issues while keeping the UX resilient.

## Architecture Snapshot
- **Routing**: Next.js catch-all page plus `vercel.json` rewrites to preserve React Router deep links on Vercel.
- **State & Data**: Feature hooks/contexts encapsulate Kanban tasks, dashboard totals, and CRM entities with optimistic mutations + live subscriptions.
- **Authentication**: OAuth via NextAuth/Auth.js (GitHub/Google ready); middleware enforces protected routes server-side.
- **Quality Tooling**: ESLint, Prettier, TypeScript strict mode, Jest unit tests, and Playwright e2e coverage.
- **CI/CD**: GitHub Actions pipeline (see `.github/workflows/ci.yml`) runs lint/type/test/build/codegen and deploys to Vercel preview & production.
- **Docs & Ops**: Runbooks stored under `docs/runbooks`; `AGENTS.md` is reserved for automation/agents and mirrors highlights from this README.

## Prerequisites
- Node.js 18 (match `.github/workflows/ci.yml`)
- npm 9+
- A running GraphQL API that matches the code-generated operations (NestJS Query reference implementation by default)
- OAuth credentials (GitHub, Google, etc.) for NextAuth

## Environment Configuration
Create `.env.local` and populate the values you need. All secrets belong in your local env file or Vercel project settings.

| Variable | Purpose |
| --- | --- |
| `NEXTAUTH_URL` | Application base URL (set to `http://localhost:3000` for dev). |
| `NEXTAUTH_SECRET` | Random string for NextAuth session encryption. |
| `GITHUB_ID` / `GITHUB_SECRET` | OAuth credentials for GitHub provider (optional but recommended). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials for Google provider if enabled. |
| `OAUTH_JIT_WHITELIST` | Optional CSV list of email domains allowed to self-onboard. e.g., @gmail.com,@microsoft.com |
| `NEXT_PUBLIC_API_BASE_URL` | REST endpoint consumed by Refine data provider. |
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL HTTP endpoint used for queries/mutations. |
| `NEXT_PUBLIC_GRAPHQL_WS_URL` | GraphQL WebSocket endpoint for live updates. |
| `NEXT_PUBLIC_OAUTH_PROVIDERS` | Comma-separated provider keys to surface in the login UI. |
| `NEXT_PUBLIC_ENABLE_REALTIME` | Set to `true` to enable live subscriptions in the UI. |

See `src/utilities/config` and the NextAuth route handler for the full list of optional flags.

## Local Development
1. `npm install`
2. `npm run codegen` – generates types from `graphql.config.ts`.
3. `npm run dev`
4. Visit `http://localhost:3000`. Login buttons map to whichever OAuth providers are enabled through environment variables.

## Quality Gates
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run codegen:verify`
- `npm run e2e` (Playwright end-to-end smoke suite; configure `PLAYWRIGHT_BASE_URL` if needed).

Run these locally before opening a pull request to mirror CI.

## CI/CD
The `CI` workflow in `.github/workflows/ci.yml` runs on pull requests and pushes to `main`:
- Installs dependencies via `npm ci` on Node 18.
- Executes linting, type checking, Jest unit tests, GraphQL codegen verification, and a production `next build`.
- Produces build output for confidence, but does **not** deploy.

Vercel’s native Git integration handles deployments. Every push gets a Preview deploy; if automatic production is disabled you can promote a preview manually from the Vercel dashboard.

## Deployment Playbook
1. Confirm `main` is green in GitHub (`CI` workflow).
2. In Vercel, open the latest Preview deployment and click **Promote to Production** (available when automatic production deploys are disabled under Project Settings → Git → Production Branch).
3. Verify OAuth callbacks in Vercel (`Settings → Domains`) and confirm real-time widgets update by interacting with the kanban board.
4. Capture any notes in `docs/runbooks` if unusual steps were required.

### Optional: Disable Automatic Production Deploys
- In Vercel Project Settings → Git, toggle **“Create Production Deployments for the Production Branch”** off.
- Promotions are now manual: review a preview, hit **Promote**, and the production domain updates without waiting for another push.

## Operational Runbooks
- Schema changes: `docs/runbooks/schema-updates.md`
- Database seeding: `docs/runbooks/seeding.md`

Use these documents to keep maintenance tasks reproducible. Update them alongside backend changes so the frontend stays in sync.

## Additional References
- `AGENTS.md` – automation companion that mirrors this README for agent workflows.
- `vercel.json` – SPA rewrites keeping React Router deep links functional on Vercel.
- `playwright.config.ts` – E2E harness with optional `PLAYWRIGHT_BASE_URL` override.

Questions or improvements? Capture decisions in `AGENTS.md` and extend the runbooks to keep the project production-ready.
