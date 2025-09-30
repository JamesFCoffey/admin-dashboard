# Schema Update Runbook

This guide covers how to revise the GraphQL schema that powers the Refine data layer while keeping the Next.js client stable.

## Prerequisites
- Backend repository access (NestJS Query reference service or equivalent).
- Admin credentials for the database targeted by the API.
- Updated architecture decisions captured in `AGENTS.md` when scope changes.

## Steps
1. **Plan the change**
   - Document the breaking/non-breaking nature of the change in your issue.
   - Update `AGENTS.md` if the schema change affects architecture or realtime coverage.
2. **Update the backend**
   - Adjust the NestJS Query DTOs/resolvers.
   - Run backend tests and migrations.
3. **Refresh codegen inputs**
   - Update `graphql/*.graphql` documents in this repo as needed.
   - Run `npm run codegen` to regenerate `src/graphql/schema.types.ts` and `src/graphql/types.ts`.
   - Commit regenerated artifacts. `npm run codegen:verify` must pass cleanly.
4. **Verify frontend usage**
   - Update Refine hooks, selectors, and context consumers.
   - Run `npm run test` and `npm run typecheck`.
   - Trigger `npm run e2e` if the change touches flows covered by Playwright.
5. **Deploy**
   - Open a PR referencing the schema change and include testing notes.
   - Merge once CI passes; Vercel preview deploys automatically.
   - Promote to production via the manual deployment workflow when ready.
6. **Post-deploy**
   - Smoke test kanban board, dashboards, and any UI that surfaces the updated schema.
   - Capture retro notes or follow-up tasks in `docs/runbooks` or `AGENTS.md`.
