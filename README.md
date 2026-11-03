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

The application and a private PostgreSQL service are deployed in the Dokploy production environment at `https://spiritus.click`. Dokploy runs Prisma migrations and the idempotent organisation seed before starting Next.js. The database URL and Better Auth secret are runtime environment variables; an external database port is managed separately in Dokploy.

**Automatic deployment is off** — pushing to the repository does not rebuild the app. To release a change, trigger a manual **Deploy** in the Dokploy dashboard (or enable auto-deploy for the application).

The live health check is `https://spiritus.click/api/health`. Configure database backups in Dokploy before storing durable business data.

Remaining gaps before full production use: email delivery for invitations (links are currently shared manually), email verification, rate limiting, a comprehensive audit log and secure document storage. Do not enter real customer data until those controls are implemented and reviewed.

## DeepSeek AI

Platform administrators can open **Settings → DeepSeek AI**, enter an API key and a model available to their account, enable AI, and save the connection. Enabling verifies the key and model against DeepSeek's models endpoint. Alternatively, configure `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` in the application environment. No key is required to run the CRM.

Keys entered in Settings are encrypted with AES-256-GCM using a key derived from `BETTER_AUTH_SECRET`. Preserve that secret across deployments; after rotating it, re-enter the DeepSeek key. The browser receives only connection status, never the stored key. A saved disabled configuration overrides the environment fallback.

On a lead detail page, **Generate summary** sends the authorized lead's title, company, stage, description (up to 6,000 characters) and three recent notes (up to 2,000 characters each) to DeepSeek. Contact email/phone are not included as separate fields; free text may contain personal information. Requests are explicit, limited to one per user per 30 seconds, and do not change CRM records. API charges use your DeepSeek account. Review AI suggestions before acting.

The deployment runs the additive AI configuration/rate-limit migration automatically. Reference: https://api-docs.deepseek.com/.


## Workspace workflows

- **Overview**: pipeline values, stage age, win rate, overdue tasks, and a three-month forecast, separated by currency. Forecasting uses fixed stage probabilities and each lead's expected close date; it is an estimate, not booked revenue.
- **Leads**: compact board with collapsible empty stages and grouped closed outcomes. Opening a lead from the workspace uses a side drawer; a direct URL opens the full detail page. Tabs separate overview, tasks, notes, activity, quotes, and AI. Save personal filter views; List view supports up to 100 selected leads for assignment or stage changes. All selected records must pass edit checks; stage changes require one organisation.
- **Companies**: organisation-scoped company profiles, multiple contacts, linked leads and conversation history. The migration links existing lead company names to new profiles without discarding original values. Company/contact editing requires an active non-viewer role.
- **My work**: personal daily tasks and lead follow-ups, Today / Open / Overdue / Upcoming / Completed views, due dates in Harare time, completion and re-opening. Overdue reminders are in-app; no email or push scheduler is included. Personal tasks are only visible to their assignee.
- **Quotes**: exact decimal line calculations, tax, draft editing, internal approval, print / Save as PDF via the browser, and one-time conversion into a project. Approvals require a platform admin, organisation admin, or sales manager. Submitting for approval does not email the quote. Conversion associates the lead with the new project; the confirmation explains that this replaces a previous association.
- **Issues**: project-linked issue reporting, assignments, priority, Open / In progress / Resolved workflow, mandatory resolution notes, activity history and time logs.
- **Timers**: server-persisted start/stop entries for tasks and issues. Only one timer may run per person; completion/resolution stops related active timers. The active timer is available in the header. Timers continue while the browser is closed until stopped or the work is completed.

The UI retains square corners, HONOR Sans, reduced-motion support, and accessible modal forms. The split-screen sign-in uses an AI-generated technology image bundled in `public/images/workspace-tech.webp`.

## Verification

`npm test` runs focused tests for encryption, access guards, filter behaviour and quote arithmetic. `tests/workflows.integration.test.ts` is opt-in: set `CRM_INTEGRATION=1` and a `DATABASE_URL` pointing to a disposable PostgreSQL database whose name starts with `crm60_verify_`, after applying migrations. It exercises real company/contact, lead, task, timer, quote approval/conversion, issue resolution, saved-view and bulk-action workflows. Never point this integration suite at the production database.

### DeepSeek model selection

Use `deepseek-flash` for CRM summaries (the default), or `deepseek-v4-pro` for more complex analysis. The Settings model picker also supports an exact custom identifier returned by DeepSeek's models endpoint. Model and API-key formatting errors are shown separately. Enabling AI still verifies the selected model against the account's actual available models. Summaries explicitly disable thinking mode to avoid spending their small output budget on reasoning. Current model reference: https://api-docs.deepseek.com/quick_start/pricing/.

### Navigation performance

Session and membership reads are deduplicated within each server render using `React.cache`; permissions are not cached across requests or users. Scoped record lists reuse the loaded access profile instead of making additional permission queries per row. Sidebar reminder counts and the active timer stream independently of page content. Workspace and lead-drawer loading boundaries provide immediate navigation feedback while dynamic content loads. The sidebar shows a pending indicator for an active navigation.
