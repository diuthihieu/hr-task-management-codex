# Orbit Base MVP architecture

## Product boundary

This release implements the Phase 1–2 vertical slice: Workspace → Base → Table → Fields/Records → Saved Views. Dashboard and Kanban renderers prove that later modules can consume the same table engine; the visual workflow editor and advanced formula/relationship execution are intentionally left for later phases.

## Runtime layers

```text
Next.js App Router
├── workspace feature components
│   ├── navigation and view chrome
│   ├── TanStack-powered data grid
│   ├── saved view configuration panels
│   ├── record detail drawer
│   └── dashboard / kanban consumers
├── domain
│   ├── dynamic field and value types
│   └── view/filter/sort/format configurations
├── query engine
│   ├── nested AND/OR predicates
│   ├── typed comparisons and date scopes
│   ├── stable multi-sort and search
│   └── grouping / conditional-format evaluation
└── persistence
    ├── zero-setup local demo adapter
    └── PostgreSQL + Drizzle production schema
```

The React workspace operates against a single `AppState` boundary. It can be replaced by server repositories without rewriting the grid, query engine, or view components.

## Dynamic-field storage

The PostgreSQL design is hybrid relational + JSONB:

- `fields` stores schema metadata, validation, configuration, order, visibility and defaults.
- `data_records.data` is a JSONB row-read model for efficient record hydration and flexible sparse fields.
- `record_values` is a normalized typed projection (`text`, `number`, `boolean`, `date`, `json`, `search`) used for indexed filters, sorting, formulas, relations and aggregates.
- Application writes update `data_records.data` and the relevant `record_values` row inside one transaction.
- GIN on record JSON supports ad-hoc containment; B-tree composite indexes on `(field_id, typed_value)` support high-volume field queries.

This avoids adding physical columns per custom field and avoids storing an entire Base as one unqueryable JSON document.

## Folder structure

```text
src/
├── app/                    # App Router entry, metadata, global tokens
├── components/
│   ├── ui/                 # Owned interface primitives
│   └── workspace/          # Feature UI and interaction slices
├── data/                   # HR Operations demo fixtures
├── db/                     # Drizzle client and PostgreSQL schema
├── domain/                 # Framework-independent Base engine types
└── lib/                    # Query engine, formatting and utilities
```

## Phase sequence

1. Foundation: authentication adapter, server repository, Workspace/Base/Table CRUD, field validation.
2. Data interaction: server query compiler, pagination/virtualization, collaborative writes and undo log.
3. Task experience: calendar/Gantt/form renderers, subtasks, dependencies and attachments.
4. Analytics: editable dashboard blocks, chart data compiler and cross-filters.
5. Automation: durable queue, workflow graph validation, retries and execution history.
6. Advanced data: link fields, lookup/rollup dependency graph and formula evaluator.
7. Enterprise: SSO, policy enforcement, audit retention, API controls and performance hardening.

## Production notes

- The Docker image uses Next.js standalone output and runs as an unprivileged user.
- PostgreSQL is provided by `docker-compose.yml` for local/internal deployment.
- Authentication tables and workspace roles are present, but the demo currently uses a fixed local identity; wiring credentials/SSO is the next server-side vertical slice.
- A reverse proxy should terminate TLS, enforce request-size limits and rate limiting in a company deployment.
