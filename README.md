# Orbit Base — HR Task Operating System

Orbit Base is an HR task operating system built around one canonical Task Base. It combines fast personal capture in **My Work**, configurable saved views, goals and OKRs, and live multi-page dashboards without duplicating task data.

## Product surfaces

- **Task Base:** rich task schema, inline editing, nested filters, sorting, grouping, conditional formatting, List, Timeline, Kanban, Calendar, Gantt and grid views.
- **My Work:** keyboard-first brain dump, timing/category/duration capture, thought map, clarification workflow and atomic conversion into Task Base records.
- **Dashboards:** reusable pages, page-level filters, KPI/chart/list/text visuals and live aggregation over Task Base.
- **Goals & OKRs:** objective/key-result planning linked to canonical tasks.
- **Authentication:** Google and Microsoft OAuth through Auth.js, with a safe provider-setup state when credentials are not configured.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo edits persist in browser local storage; use **Reset demo** in the table title bar to restore the HR seed.

## Google and Microsoft sign-in

Authentication is implemented with Auth.js and becomes mandatory only when `AUTH_REQUIRED=true`. Configure at least one provider together with a strong `AUTH_SECRET`:

- Google callback: `https://your-domain/api/auth/callback/google`
- Microsoft callback: `https://your-domain/api/auth/callback/microsoft-entra-id`

Copy the corresponding variables from [.env.example](.env.example). Microsoft defaults to the `common` tenant so work, school, and personal accounts can sign in; replace `AUTH_MICROSOFT_ENTRA_ID_ISSUER` with an organization tenant URL to restrict it. `AUTH_ALLOWED_EMAILS` and `AUTH_ALLOWED_DOMAINS` provide an optional workspace allowlist.

## Validate

```bash
npm run lint
npm test
npm run build
npm run db:generate
```

## PostgreSQL development

```bash
docker compose up -d postgres
Copy-Item .env.example .env.local
npm run db:push
```

For a complete description of the architecture and hybrid dynamic-field storage strategy, see [docs/architecture.md](docs/architecture.md).
