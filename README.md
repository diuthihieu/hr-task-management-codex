# Orbit Base

Orbit Base is a functional work-management MVP built around a reusable dynamic-table engine. The included HR Operations workspace demonstrates dynamic fields and records, inline editing, saved views, nested filters, sorting, grouping, conditional formatting, bulk updates, record detail, a live dashboard and drag-to-update Kanban.

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
