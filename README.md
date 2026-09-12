# Orbit Base

Orbit Base is a functional work-management MVP built around a reusable dynamic-table engine. The included HR Operations workspace demonstrates dynamic fields and records, inline editing, saved views, nested filters, sorting, grouping, conditional formatting, bulk updates, record detail, a live dashboard and drag-to-update Kanban.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo edits persist in browser local storage; use **Reset demo** in the table title bar to restore the HR seed.

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
