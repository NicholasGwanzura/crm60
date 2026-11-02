# DeepSeek implementation handover: usable Plane-inspired CRM workspace

## Goal

The deployed app at `https://spiritus.click` currently feels like a placeholder. It does not present a Plane-like workspace and visitors cannot add leads. Implement the actual lead workflow with a compact, polished shadcn-style interface using the existing Tailwind setup and HONOR Sans.

## Diagnose the current state

- Anonymous visitors are intentionally shown a setup/preview card in `src/app/(workspace)/leads/page.tsx` and `projects/page.tsx`.
- The lead creation form already exists in `src/components/new-lead-form.tsx`, but only authenticated users with an editable organisation role can access it.
- Lead creation actions are in `src/app/(workspace)/leads/actions.ts` and call `requireUser()` plus role/scope checks.
- `src/components/lead-pipeline.tsx` renders the board. The project module is in `src/app/(workspace)/projects/`.
- No administrator bootstrap or invited user setup is currently available. Thus the signed-in workflow may be impossible to reach on a fresh deployment.

Inspect the actual schema, permissions, and current UI before editing. Preserve authentication and tenant isolation. Do not expose client records or enable unauthenticated writes to make the UI look populated.

## Product requirements

1. Make `/leads` the primary workspace screen, with a Plane-inspired left navigation/sidebar, clear workspace/org switch context, page title, search, filters, view controls, and a prominent **Add lead** action.
2. Show a useful pipeline board grouped by configured lead stages. Include lead/company, value, owner, last activity, and useful empty states. Provide a table/list view if practical. Keep keyboard and mobile use functional; do not depend on drag-and-drop alone (provide accessible stage-change controls).
3. Add lead flow: title/name, company, contact name/email/phone, value/currency if supported by schema, source, owner if supported, stage, and optional project. Use existing schema fields, validation, and server actions; never invent unsupported persistence fields.
4. Build out lead detail enough to be operational: edit permitted fields, stage change, project association, notes/activity, and return navigation.
5. Make projects feel like an integrated workspace module: list/search, status, owner, lead count, create project, project detail, and add/associate leads. Use existing schema and role rules.
6. Use consistent Tailwind utilities and the project's existing UI primitives/tokens. Visual direction: restrained Plane-like product UI, compact spacing, neutral surfaces, subtle borders, clear hierarchy, purposeful color for status, HONOR Sans. Avoid generic gradient/marketing cards.
7. Empty state must explain why the board is empty and provide a visible Add lead action for an authorized user. When there are no organisations or no editable memberships, explain the required setup.
8. Make the app usable by its team: implement a safe first-admin bootstrap or documented invitation/onboarding path. Never hardcode credentials, weaken auth, make customer records public, or log secrets. A platform admin should be able to invite users and assign organisation roles. If this is outside scope, provide precise operator steps to create the first admin securely.

## Access and security requirements

- Every read and mutation must enforce user status, organisation membership, role, and record scope on the server.
- Anonymous visitors may see a branded shell and non-sensitive setup guidance only. Do not query or render CRM records for them.
- Keep signup policy as configured. Never turn `currentUser()` into an authorization bypass.
- Validate all submitted values server-side; verify referenced stages/projects belong to the same organisation; use transactions for lead plus activity creation where appropriate.
- Hide controls users cannot use, but enforce authorization in server actions regardless of UI state.

## Suggested implementation order

1. Trace `prisma/schema.prisma`, `src/lib/permissions.ts`, all lead actions/pages, project actions/pages, and app shell. Identify the current operator path to obtain an authenticated editable account.
2. Fix onboarding/access setup safely so an authorized teammate can reach CRM features.
3. Refactor the shared workspace shell/navigation and responsive layout.
4. Complete the leads page, board/list, empty states, and add-lead dialog/form.
5. Complete detail/edit/activity and project association workflows.
6. Polish projects pages to share the same visual system.
7. Update README with first-admin setup, environment requirements, and operating instructions.

## Acceptance criteria

- An authorized user can create a lead from `/leads`, see it immediately in the correct stage, open its detail, edit allowed fields, move stage, add a note, and associate it with a project.
- A user without an editable role cannot create/update leads even by directly invoking actions.
- Anonymous access shows no leads, contacts, project records, or private metadata; attempted private routes do not leak records.
- A new deployment has a documented, secure route to create/invite the first authorized user.
- The UI has a coherent Plane-inspired sidebar and compact workspace navigation, and works on narrow screens and with keyboard controls.
- Existing migrations/seed remain safe and idempotent. No destructive data migration.

## Handoff expectations

Implement in the repository, not as a mockup. Summarize changed files and any operator setup needed. Do not deploy or alter production data unless the repository owner explicitly asks for deployment. Keep credentials out of this handover and all logs.

## Reference: Plane project management

The requested product reference is [Plane project management](https://plane.so/project-management). Treat Plane as the target product feel and workflow reference, not a request to clone its marketing site or copy proprietary assets. This workspace should feel like an execution tool the team can use every day.

Design and interaction direction to carry into implementation:

- Prioritize the app workspace canvas: persistent navigation, fast access to leads/projects, compact toolbar, focused content, and useful context in detail panels.
- Make work state and next actions visible immediately. Group opportunities by configurable stages, surface ownership and activity, and keep search/filtering close to the board.
- Keep hierarchy clear: organisation/workspace → project → leads and activity. Support moving from overview to a record without losing context.
- Prefer low overhead and progressive complexity: show the core lead workflow first; put less-used filters and configuration behind menus/panels.
- Use consistent state transitions and explicit controls. Drag and drop may be an enhancement, but always offer keyboard accessible menus/buttons to change stage.
- Include intake/creation directly in the workflow, with a prominent Add lead control and an empty state that explains the next step.
- For project tracking, provide useful status, owners, progress/lead counts, and project detail; avoid inert project cards that have no meaningful actions.
- Apply a polished, restrained application aesthetic: compact typography and spacing, quiet neutral surfaces, clear borders, subtle status colors, responsive layout, and keyboard navigation. Keep HONOR Sans as the brand font.

The current `/leads` and `/projects` unauthenticated branches intentionally display setup preview cards. The product is currently blocked by missing first-user onboarding as well as incomplete interface/workflows. Solve onboarding securely so real authorized teammates can use the features; do not make the CRM public to simulate progress. Plane’s own page emphasizes structured work hierarchy, intake into a triage queue, configurable workflows, real-time visibility, integrations, and progressive complexity; prioritize the subset that the current CRM schema can support.
