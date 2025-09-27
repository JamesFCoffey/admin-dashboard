# Implementation Plan & Architecture Decisions

## Target Architecture Overview
- **Framework**: Next.js 14 app router hosting a refined React SPA shell executed client-side via dynamic import to keep existing Refine setup while enabling Vercel-friendly routing.
- **Routing Strategy**: Preserve React Router pages but add Next.js catch-all page with rewrites (`vercel.json`) so deep links resolve; consider phased migration to native Next routes as stretch.
- **State Management**: Centralize server synchronization with Refine hooks, move feature-specific state (Kanban, dashboard metrics) into dedicated hooks/contexts, expose selectors for reusable components.
- **Real-Time Layer**: Use Refine live provider (GraphQL WebSocket) for subscriptions on tasks board, deals chart, and counts; implement optimistic updates with reconciliation handlers.
- **Authentication**: Replace demo login with OAuth via NextAuth (Auth.js) using provider(s) like GitHub/Google; tokens stored in secure cookies, session surfaced through context for Refine auth provider bridge.
- **Configuration**: All external URLs, OAuth secrets, and feature flags loaded via environment variables (`.env.local` for development, Vercel project env for deploy); add runtime validation using Zod.
- **Error Handling & Observability**: Add global error boundary, toast notifications, structured logging, and basic telemetry hooks (console/info for demo, swappable to Sentry/New Relic).
- **Deployment**: Primary target is Vercel (preview + production). Dockerfile maintained for local/alt deployments but not primary. Build output stays in `dist` via `next export`.

## Execution Plan
1. **Architecture Setup**
   - Introduce env validation utility and move API/OAuth endpoints into typed config.
   - Add global error boundary and logging utilities.
   - Create `vercel.json` with SPA rewrites and document routing strategy.

2. **Authentication Upgrade**
   - Install/configure NextAuth providers, callbacks, and session management.
   - Bridge NextAuth session into Refine `authProvider` (secure cookie handling, refresh logic).
   - Replace existing Auth UI with NextAuth-friendly flows (login, logout, forgot/reset).

3. **Realtime & State Enhancements**
   - Implement subscriptions for Kanban, dashboard cards, and chart components.
   - Refactor task board logic into reusable hooks/context with optimistic update helpers.
   - Add shared data mappers/selectors for charts/cards; update components to consume them.

4. **Quality Tooling & Tests**
   - Add lint/type/test scripts, configure ESLint + Prettier + TypeScript strict checks.
   - Introduce Jest + Testing Library unit/integration tests and Playwright e2e covering auth, dashboard, CRM CRUD, and Kanban drag/drop.
   - Add Storybook (optional but recommended) for reusable components and accessibility snapshots.

5. **CI/CD & Documentation**
   - Set up GitHub Actions pipeline running install, lint, typecheck, tests, build, codegen validation, and deploying to Vercel previews.
   - Document deploy process, env vars, testing commands, and architecture overview in README.
   - Capture maintenance runbooks (schema updates, seed scripts) and add screenshots or demos.

6. **Polish & Verification**
   - Run full QA checklist (tests, lint, typecheck, accessibility scan, Lighthouse).
   - Validate staging deployment on Vercel, confirm OAuth callbacks and realtime flows.
   - Gather final assets (screenshots, metrics) for resume/portfolio usage.

## Open Questions & Stretch Goals
- Evaluate timelines and complexity for full migration to native Next routing; optional but simplifies future iterations.
- Consider multi-tenant or RBAC scenarios for additional resume bullet points.
- Explore analytics/logging integrations (Sentry, Logtail) if aiming for deeper production-readiness narrative.
