# Spiritus × Velocity Workspace

This application uses HONOR Sans under the included [HONOR Sans Copyright License Agreement](src/app/fonts/HONOR-Sans-LICENSE.txt).

This repository contains an initial CRM implementation. It supports invite-only email/password accounts, organisation memberships, scoped lead queries, lead creation, stage changes, notes, an activity timeline, search, and pagination. The rest of the master brief remains to be implemented before production use.

## Local setup

1. Copy `.env.example` to `.env` and set a strong `BETTER_AUTH_SECRET`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Run `npm ci`, `npm run db:migrate`, and `npm run db:seed`.
4. Run `npm run dev`.

No users or passwords are seeded. Public signup is disabled. A token-backed invitation acceptance flow and administrator bootstrap are still pending; the UI cannot be used with a fresh database yet.

## Production status

Do not deploy this as a production CRM. Email verification, invitation delivery, rate limiting, audit logs, secure document storage, jobs, integration tests, and most business modules in the master brief are incomplete. The Docker image is a build artifact for development and staging.

## Planned Dokploy domain

Use `spiritus.click` for the production application. Configure the Dokploy domain with HTTPS and set `BETTER_AUTH_URL=https://spiritus.click` in the production environment. Point the domain's DNS records at the Dokploy host only when the deployment is ready. Keep PostgreSQL private and use a managed or persistent database volume with backups. No deployment has been made.
