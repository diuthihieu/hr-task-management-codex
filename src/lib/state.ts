import type { AppState, DataTable, OkrStore, SavedView } from "@/domain/base";
import { initialAppState } from "@/data/hr-demo";

export const STORAGE_KEY = "orbit-base:task-os:v5";
export const LEGACY_STORAGE_KEYS = ["orbit-base:mvp:v4", "orbit-base:mvp:v3", "orbit-base:mvp:v2", "orbit-base:mvp:v1"] as const;

export function normalizeAppState(value: unknown, migratingLegacy = false): AppState {
  if (!isAppStateShape(value)) return structuredClone(initialAppState);

  const next = structuredClone(value);
  next.okrs = mergeOkrStore(next.okrs, initialAppState.okrs);
  next.taskCategories = mergeById(next.taskCategories ?? [], initialAppState.taskCategories);
  next.capturedThoughts = next.capturedThoughts ?? structuredClone(initialAppState.capturedThoughts);
  next.dashboards = next.dashboards?.length ? next.dashboards : structuredClone(initialAppState.dashboards);
  next.activeDashboardId = next.dashboards.some((dashboard) => dashboard.id === next.activeDashboardId) ? next.activeDashboardId : next.dashboards[0].id;
  const activeDashboard = next.dashboards.find((dashboard) => dashboard.id === next.activeDashboardId) ?? next.dashboards[0];
  next.activeDashboardPageId = activeDashboard.pages.some((page) => page.id === next.activeDashboardPageId) ? next.activeDashboardPageId : activeDashboard.defaultPageId;
  const demoWorkspace = initialAppState.workspaces[0];
  const currentDemoWorkspace = next.workspaces.find((workspace) => workspace.id === demoWorkspace.id);
  if (currentDemoWorkspace) {
    const demoBase = demoWorkspace.bases[0];
    const currentDemoBase = currentDemoWorkspace.bases.find((base) => base.id === demoBase.id);
    if (currentDemoBase) {
      currentDemoBase.tables = currentDemoBase.tables.map((table) => {
        const template = demoBase.tables.find((item) => item.id === table.id);
        return template ? mergeTableSchema(table, template, migratingLegacy) : normalizeTable(table);
      });
    }
  }

  const workspace = next.workspaces.find((item) => item.id === next.activeWorkspaceId) ?? next.workspaces[0];
  const base = workspace?.bases.find((item) => item.id === next.activeBaseId) ?? workspace?.bases[0];
  const table = base?.tables.find((item) => item.id === "table-tasks") ?? base?.tables.find((item) => item.id === next.activeTableId) ?? base?.tables[0];
  const view = table?.views.find((item) => item.id === next.activeViewId) ?? table?.views[0];
  if (!workspace || !base || !table || !view) return structuredClone(initialAppState);

  next.activeWorkspaceId = workspace.id;
  next.activeBaseId = base.id;
  next.activeTableId = table.id;
  next.activeViewId = view.id;
  return next;
}

function mergeOkrStore(store: OkrStore | undefined, template: OkrStore): OkrStore {
  if (!store) return structuredClone(template);
  const mergeById = <T extends { id: string }>(current: T[], defaults: T[]) => {
    const ids = new Set(current.map((item) => item.id));
    return [...current, ...defaults.filter((item) => !ids.has(item.id)).map((item) => structuredClone(item))];
  };
  return {
    teams: mergeById(store.teams ?? [], template.teams),
    cycles: mergeById(store.cycles ?? [], template.cycles),
    objectives: mergeById(store.objectives ?? [], template.objectives),
    keyResults: mergeById(store.keyResults ?? [], template.keyResults),
    urgencyDueDays: store.urgencyDueDays ?? null,
  };
}

function mergeById<T extends { id: string }>(current: T[], defaults: T[]) {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...defaults.filter((item) => !ids.has(item.id)).map((item) => structuredClone(item))];
}

function mergeTableSchema(table: DataTable, template: DataTable, migratingLegacy: boolean): DataTable {
  const existingFieldIds = new Set(table.fields.map((field) => field.id));
  const addedFieldIds = new Set(template.fields.filter((field) => !existingFieldIds.has(field.id)).map((field) => field.id));
  const fields = [
    ...table.fields,
    ...template.fields.filter((field) => !existingFieldIds.has(field.id)),
  ].map((field, index) => ({ ...field, order: index }));
  const existingViewIds = new Set(table.views.map((view) => view.id));
  const templateViews = new Map(template.views.map((view) => [view.id, view]));
  const views = [
    ...table.views.map((view) => {
      const normalized = normalizeView(view);
      const templateView = templateViews.get(view.id);
      const newlyHiddenFields = templateView?.hiddenFieldIds.filter((fieldId) => migratingLegacy || addedFieldIds.has(fieldId)) ?? [];
      return { ...normalized, hiddenFieldIds: [...new Set([...normalized.hiddenFieldIds, ...newlyHiddenFields])] };
    }),
    ...template.views.filter((view) => !existingViewIds.has(view.id)).map((view) => structuredClone(view)),
  ];
  const templateRecords = new Map(template.records.map((record) => [record.id, record]));
  const records = table.records.map((record) => {
    const templateRecord = templateRecords.get(record.id);
    const values = { ...record.values };
    for (const field of fields) {
      if (!(field.id in values)) values[field.id] = templateRecord?.values[field.id] ?? field.defaultValue ?? null;
    }
    return { ...record, values };
  });
  return { ...table, fields, records, views };
}

function normalizeTable(table: DataTable): DataTable {
  return { ...table, views: table.views.map(normalizeView) };
}

function normalizeView(view: SavedView): SavedView {
  const legacyHeight = (view as unknown as { rowHeight?: string }).rowHeight;
  return {
    ...view,
    kind: view.kind ?? "grid",
    filters: view.filters ?? { id: `filters-${view.id}`, conjunction: "and", conditions: [] },
    sorting: view.sorting ?? [],
    hiddenFieldIds: view.hiddenFieldIds ?? [],
    columnOrder: view.columnOrder ?? [],
    frozenFieldCount: view.frozenFieldCount ?? 1,
    rowHeight: legacyHeight === "tall" ? "comfortable" : legacyHeight === "compact" || legacyHeight === "default" || legacyHeight === "comfortable" || legacyHeight === "auto" ? legacyHeight : "compact",
    maxAutoHeight: view.maxAutoHeight ?? 144,
    conditionalFormatting: view.conditionalFormatting ?? [],
  };
}

function isAppStateShape(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppState>;
  return Array.isArray(candidate.workspaces) && candidate.workspaces.length > 0
    && typeof candidate.activeWorkspaceId === "string"
    && typeof candidate.activeBaseId === "string"
    && typeof candidate.activeTableId === "string"
    && typeof candidate.activeViewId === "string";
}
