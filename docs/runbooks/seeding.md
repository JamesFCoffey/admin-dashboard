# Data Seeding Runbook

Use this guide to load demo or test data so the dashboard showcases meaningful content for QA and demos.

## Seed Strategies
- **API-driven seeding**: Preferred for hosted environments. Use GraphQL mutations or REST endpoints exposed by the backend.
- **Database snapshot**: Restore a sanitized dump for local development when the API is not publicly reachable.

## Steps: API-driven Seeding
1. Ensure your `.env.local` points to the target API/GraphQL endpoints.
2. Authenticate via OAuth (GitHub/Google) using an account included in `OAUTH_JIT_WHITELIST`.
3. Run the backend seeding script (see backend repo) or execute the provided GraphQL `seed` mutation sequence.
4. Confirm entities in the UI: kanban columns, deals metrics, activity feed.
5. Capture any adjustments or custom mutations in this runbook for future reuse.

## Steps: Database Snapshot
1. Obtain the latest sanitized dump from the ops team.
2. Restore into your local database instance.
3. Update API connection strings and restart the backend service.
4. Regenerate frontend types with `npm run codegen` if schema differences exist.
5. Run `npm run dev` and smoke test the dashboard.

## After Seeding
- Update screenshots or demo recordings in `docs/assets/` if notable UI changes occurred.
- Note any new seed scripts or IDs in `AGENTS.md` if they influence architecture decisions.
- Run the CI suite locally (`npm run lint`, `npm run test`, `npm run typecheck`) before pushing.
