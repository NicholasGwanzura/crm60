# Spiritus × Velocity Workspace

This application uses HONOR Sans under the included [HONOR Sans Copyright License Agreement](src/app/fonts/HONOR-Sans-LICENSE.txt).

This repository contains an initial CRM implementation. It includes Better Auth sign-in, organisation memberships, scoped lead queries, lead creation, stage changes, notes, an activity timeline, search, and pagination. The rest of the master brief remains to be implemented before production business use.

## Local setup

1. Copy `.env.example` to `.env` and set a strong `BETTER_AUTH_SECRET`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Run `npm ci`, `npm run db:migrate`, and `npm run db:seed`.
4. Run `npm run dev`.

No users or passwords are seeded. Public signup is disabled. A token-backed invitation acceptance flow and administrator bootstrap are still pending. The public workspace preview shows organisation and pipeline configuration without exposing client records or mutations.

## Deployment status

The application and a private PostgreSQL service are deployed in the Dokploy production environment at `https://spiritus.click`. Dokploy runs Prisma migrations and the idempotent organisation seed before starting Next.js. The database URL and Better Auth secret are runtime environment variables; no public database port is configured. Automatic deployment is off.

This is an infrastructure deployment, not a production-ready CRM release. The sign-in screen is temporarily removed; unauthenticated visitors can view only the workspace preview. Public signup is disabled and no administrator account exists. Email verification, invitation delivery, rate limiting, audit logs, secure document storage, jobs, integration tests, and most business modules in the master brief are incomplete. Do not enter real customer data until those controls and workflows are implemented and reviewed.

The live health check is `https://spiritus.click/api/health`. Configure database backups in Dokploy before storing durable business data.
