# Spiritus × Velocity Workspace

This application uses HONOR Sans under the included [HONOR Sans Copyright License Agreement](src/app/fonts/HONOR-Sans-LICENSE.txt).

A Plane-inspired CRM workspace. It provides a lead pipeline (kanban board and list views), lead detail with notes and an activity timeline, a projects module with linked leads, and team management with token-backed invitations. Better Auth handles email/password sign-in, organisation memberships, scoped lead queries, and role-based permissions.

## Local setup

1. Copy `.env.example` to `.env` and set a strong `BETTER_AUTH_SECRET` (at least 32 random characters).
2. Start PostgreSQL with `docker compose up -d db`.
3. Run `npm ci`, `npm run db:migrate`, and `npm run db:seed`.
4. Create the first administrator (see below).
5. Run `npm run dev`.

## First administrator

Sign-up is disabled, so the first account is created by an operator. Set these environment variables and either run the seed (which bootstraps the admin automatically) or run `npm run db:admin`:

```bash
BOOTSTRAP_ADMIN_EMAIL=you@company.com \
BOOTSTRAP_ADMIN_PASSWORD='a-strong-password-at-least-12-chars' \
BOOTSTRAP_ADMIN_NAME='Your Name' \
npm run db:admin
```

`BOOTSTRAP_ADMIN_ORG_SLUG` defaults to `spiritus`; set it to assign the admin to a different seeded organisation. The command is idempotent — re-running it updates the name, password, and role. It does not print the password.

In Dokploy, set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` as application environment variables and redeploy — the deploy's seed step creates the admin automatically. Re-running the seed re-applies the same credentials, so keep the env password as the source of truth.

Then sign in at `/sign-in`. The admin can invite teammates from **Team** (email, organisation, role); invitees receive a link (`/invite/<token>`) to set a password and join.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `BETTER_AUTH_SECRET` | Signing secret (at least 32 characters). |
| `BETTER_AUTH_URL` | Canonical app URL (e.g. `https://spiritus.click`). |
| `BOOTSTRAP_ADMIN_EMAIL` | Email for the first admin (bootstrap only). |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password for the first admin, 12+ characters. |
| `BOOTSTRAP_ADMIN_NAME` | Optional display name for the first admin. |
| `BOOTSTRAP_ADMIN_ORG_SLUG` | Optional org slug to assign the admin to (default `spiritus`). |

## Deployment status

The application and a private PostgreSQL service are deployed in the Dokploy production environment at `https://spiritus.click`. Dokploy runs Prisma migrations and the idempotent organisation seed before starting Next.js. The database URL and Better Auth secret are runtime environment variables; no public database port is configured.

**Automatic deployment is off** — pushing to the repository does not rebuild the app. To release a change, trigger a manual **Deploy** in the Dokploy dashboard (or enable auto-deploy for the application).

The live health check is `https://spiritus.click/api/health`. Configure database backups in Dokploy before storing durable business data.

Remaining gaps before full production use: email delivery for invitations (links are currently shared manually), email verification, rate limiting, audit logs, secure document storage, and integration tests. Do not enter real customer data until those controls are implemented and reviewed.

## DeepSeek AI

Platform administrators can open **Settings → DeepSeek AI**, enter an API key and a model available to their account, enable AI, and save the connection. Enabling verifies the key and model against DeepSeek's models endpoint. Alternatively, configure `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` in the application environment. No key is required to run the CRM.

Keys entered in Settings are encrypted with AES-256-GCM using a key derived from `BETTER_AUTH_SECRET`. Preserve that secret across deployments; after rotating it, re-enter the DeepSeek key. The browser receives only connection status, never the stored key. A saved disabled configuration overrides the environment fallback.

On a lead detail page, **Generate summary** sends the authorized lead's title, company, stage, description (up to 6,000 characters) and three recent notes (up to 2,000 characters each) to DeepSeek. Contact email/phone are not included as separate fields; free text may contain personal information. Requests are explicit, limited to one per user per 30 seconds, and do not change CRM records. API charges use your DeepSeek account. Review AI suggestions before acting.

The deployment runs the additive AI configuration/rate-limit migration automatically. Reference: https://api-docs.deepseek.com/.
