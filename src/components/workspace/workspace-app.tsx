"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Cloud, Database, LoaderCircle, RotateCcw } from "lucide-react";
import type { AppState, BaseRecord, CellValue, DataTable, FieldDefinition, FieldType, FilterGroup, SavedView } from "@/domain/base";
import { createEmptyView, createId } from "@/domain/base";
import { initialAppState } from "@/data/hr-demo";
import { queryRecords } from "@/lib/query-engine";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ViewTabs, ViewToolbar } from "./view-toolbar";
import { DataGrid, type FieldAction } from "./data-grid";
import { FieldDialog, CreateEntityDialog, NewViewDialog } from "./dialogs";
import { RecordDrawer } from "./record-drawer";
import { DashboardBuilder } from "./dashboard-builder";
import { AlternateView } from "./alternate-view";
import { downloadRecords, type ExportFormat, type ExportScope } from "@/lib/export";
import { LEGACY_STORAGE_KEYS, normalizeAppState, STORAGE_KEY } from "@/lib/state";
import { OkrWorkspace } from "./okr-view";
import { MyWorkHub } from "./my-work-hub";

type FieldDialogState = { open: boolean; field?: FieldDefinition; insertAt?: number };
type EntityKind = "workspace" | "base" | "table";
type ActiveArea = "table" | "dashboard" | "okrs" | "myWork";
type WorkspaceUser = { name: string; email?: string; image?: string };

export function WorkspaceApp({ user }: { user: WorkspaceUser }) {
  const currentUser = user.name;
  const [state, setState] = useState<AppState>(initialAppState);
  const [hydrated, setHydrated] = useState(false);
  const [activeArea, setActiveArea] = useState<ActiveArea>("table");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [drawerRecordId, setDrawerRecordId] = useState<string>();
  const [fieldDialog, setFieldDialog] = useState<FieldDialogState>({ open: false });
  const [entityDialog, setEntityDialog] = useState<{ open: boolean; kind: EntityKind }>({ open: false, kind: "table" });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<string>();
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error">("saved");

  useEffect(() => {
    try {
      const current = window.localStorage.getItem(STORAGE_KEY);
      const stored = current ?? LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
      // Hydrate the zero-setup demo store once from the external browser store.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setState(normalizeAppState(JSON.parse(stored), !current));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const savingTimeout = window.setTimeout(() => setSaveStatus("saving"), 0);
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 180);
    return () => { window.clearTimeout(savingTimeout); window.clearTimeout(timeout); };
  }, [hydrated, state]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(undefined), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key.toLowerCase() !== "q" || event.metaKey || event.ctrlKey || event.altKey || target?.matches("input, textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      setState((current) => {
        const currentWorkspace = current.workspaces.find((item) => item.id === current.activeWorkspaceId);
        const currentBase = currentWorkspace?.bases.find((item) => item.id === current.activeBaseId);
        const tasks = currentBase?.tables.find((item) => item.id === "table-tasks");
        return tasks ? { ...current, activeTableId: tasks.id, activeViewId: tasks.views[0].id } : current;
      });
      setActiveArea("myWork");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const workspace = state.workspaces.find((item) => item.id === state.activeWorkspaceId) ?? state.workspaces[0];
  const base = workspace?.bases.find((item) => item.id === state.activeBaseId) ?? workspace?.bases[0];
  const table = base?.tables.find((item) => item.id === state.activeTableId) ?? base?.tables[0];
  const view = table?.views.find((item) => item.id === state.activeViewId) ?? table?.views[0];
  const taskTable = base?.tables.find((item) => item.id === "table-tasks") ?? table;
  const displayFields = useMemo(() => table ? enrichOkrFields(table.fields, state) : [], [state, table]);
  const visibleRecords = useMemo(() => table && view ? queryRecords(table.records, table.fields, view.filters, view.sorting, search) : [], [search, table, view]);
  const drawerRecord = table?.records.find((record) => record.id === drawerRecordId);

  if (!hydrated || !workspace || !base || !table || !view) return <WorkspaceSkeleton />;

  const mutateTable = (updater: (current: DataTable) => DataTable) => setState((current) => ({
    ...current,
    workspaces: current.workspaces.map((item) => item.id !== current.activeWorkspaceId ? item : {
      ...item,
      bases: item.bases.map((baseItem) => baseItem.id !== current.activeBaseId ? baseItem : {
        ...baseItem,
        tables: baseItem.tables.map((tableItem) => tableItem.id === current.activeTableId ? updater(tableItem) : tableItem),
      }),
    }),
  }));

  const updateView = (patch: Partial<SavedView>) => mutateTable((current) => ({ ...current, views: current.views.map((item) => item.id === state.activeViewId ? { ...item, ...patch } : item) }));
  const updateCell = (recordId: string, fieldId: string, value: CellValue) => mutateTable((current) => ({
    ...current,
    records: current.records.map((record) => record.id === recordId ? { ...record, values: { ...record.values, [fieldId]: value }, updatedAt: new Date().toISOString() } : record),
  }));
  const updateTask = (recordId: string, values: Record<string, string | number | null>) => setState((current) => ({
    ...current,
    workspaces: current.workspaces.map((workspaceItem) => workspaceItem.id !== current.activeWorkspaceId ? workspaceItem : {
      ...workspaceItem,
      bases: workspaceItem.bases.map((baseItem) => baseItem.id !== current.activeBaseId ? baseItem : {
        ...baseItem,
        tables: baseItem.tables.map((tableItem) => tableItem.id !== "table-tasks" ? tableItem : {
          ...tableItem,
          records: tableItem.records.map((record) => record.id === recordId ? { ...record, values: { ...record.values, ...values }, updatedAt: new Date().toISOString() } : record),
        }),
      }),
    }),
  }));
  const captureThought = (thought: Omit<AppState["capturedThoughts"][number], "id" | "createdAt" | "status" | "userId">) => {
    setState((current) => ({ ...current, capturedThoughts: [...current.capturedThoughts, { ...thought, id: createId("thought"), userId: currentUser, status: "CAPTURED", createdAt: new Date().toISOString() }] }));
    setToast("Thought captured — keep going");
  };
  const markThoughtClarifying = (id: string) => setState((current) => ({ ...current, capturedThoughts: current.capturedThoughts.map((thought) => thought.id === id ? { ...thought, status: "CLARIFYING" } : thought) }));
  const convertThought = (thoughtId: string, values: Record<string, CellValue>) => {
    const recordId = createId("task");
    const now = new Date().toISOString();
    setState((current) => ({
      ...current,
      capturedThoughts: current.capturedThoughts.map((thought) => thought.id === thoughtId ? { ...thought, status: "CONVERTED", convertedTaskId: recordId, convertedAt: now } : thought),
      workspaces: current.workspaces.map((workspaceItem) => workspaceItem.id !== current.activeWorkspaceId ? workspaceItem : {
        ...workspaceItem,
        bases: workspaceItem.bases.map((baseItem) => baseItem.id !== current.activeBaseId ? baseItem : {
          ...baseItem,
          tables: baseItem.tables.map((tableItem) => tableItem.id !== "table-tasks" ? tableItem : {
            ...tableItem,
            records: [...tableItem.records, {
              id: recordId,
              values: { ...Object.fromEntries(tableItem.fields.map((field, index) => [field.id, field.defaultValue ?? defaultForField(field, index)])), ...values, taskId: `TASK-${String(tableItem.records.length + 1).padStart(4, "0")}`, createdBy: currentUser, createdTime: now, modifiedTime: now },
              createdAt: now, updatedAt: now, createdBy: currentUser, comments: 0, attachments: 0,
            }],
          }),
        }),
      }),
    }));
    setToast("Thought converted to Task Base");
  };
  const updateCategories = (taskCategories: AppState["taskCategories"]) => setState((current) => {
    const renames = new Map(current.taskCategories.flatMap((previous) => {
      const next = taskCategories.find((category) => category.id === previous.id);
      return next && next.name !== previous.name ? [[previous.name, next.name] as const] : [];
    }));
    return {
      ...current,
      taskCategories,
      workspaces: current.workspaces.map((workspaceItem) => workspaceItem.id !== current.activeWorkspaceId ? workspaceItem : {
        ...workspaceItem,
        bases: workspaceItem.bases.map((baseItem) => baseItem.id !== current.activeBaseId ? baseItem : {
          ...baseItem,
          tables: baseItem.tables.map((tableItem) => tableItem.id !== "table-tasks" ? tableItem : {
            ...tableItem,
            fields: tableItem.fields.map((field) => field.id !== "category" ? field : { ...field, configuration: { ...field.configuration, options: taskCategories.filter((category) => !category.archived).map((category, index) => ({ id: category.id, label: category.name, color: (["slate", "blue", "cyan", "green", "amber", "violet"] as const)[index % 6] })) } }),
            records: tableItem.records.map((record) => ({ ...record, values: { ...record.values, category: renames.get(String(record.values.category ?? "")) ?? record.values.category } })),
            views: tableItem.views.map((savedView) => ({ ...savedView, filters: rewriteCategoryFilters(savedView.filters, renames) })),
          }),
        }),
      }),
    };
  });
  const openSharedArea = (area: "dashboard" | "okrs" | "myWork") => {
    const tasks = base.tables.find((item) => item.id === "table-tasks");
    if (tasks) setState((current) => ({ ...current, activeTableId: tasks.id, activeViewId: tasks.views[0].id }));
    setActiveArea(area); setSelection(new Set()); setSearch(""); setMobileNavOpen(false);
  };

  const openEntityDialog = (kind: EntityKind) => setEntityDialog({ open: true, kind });
  const switchWorkspace = (workspaceId: string) => {
    const nextWorkspace = state.workspaces.find((item) => item.id === workspaceId);
    const nextBase = nextWorkspace?.bases[0];
    const nextTable = nextBase?.tables[0];
    const nextView = nextTable?.views[0];
    if (!nextWorkspace || !nextBase || !nextTable || !nextView) return;
    setState((current) => ({ ...current, activeWorkspaceId: workspaceId, activeBaseId: nextBase.id, activeTableId: nextTable.id, activeViewId: nextView.id }));
    setActiveArea("table"); setSelection(new Set()); setSearch(""); setMobileNavOpen(false);
  };

  const switchBase = (baseId: string) => {
    const nextBase = workspace.bases.find((item) => item.id === baseId);
    const nextTable = nextBase?.tables.find((item) => item.id === "table-tasks") ?? nextBase?.tables[0];
    const nextView = nextTable?.views[0];
    if (!nextBase || !nextTable || !nextView) return;
    setState((current) => ({ ...current, activeBaseId: baseId, activeTableId: nextTable.id, activeViewId: nextView.id }));
    setActiveArea("table"); setSelection(new Set()); setSearch("");
  };

  const switchView = (baseId: string, viewId: string) => {
    const nextBase = workspace.bases.find((item) => item.id === baseId);
    const nextTable = nextBase?.tables.find((item) => item.id === "table-tasks") ?? nextBase?.tables[0];
    if (!nextBase || !nextTable || !nextTable.views.some((item) => item.id === viewId)) return;
    setState((current) => ({ ...current, activeBaseId: baseId, activeTableId: nextTable.id, activeViewId: viewId }));
    setActiveArea("table"); setSelection(new Set()); setSearch(""); setMobileNavOpen(false);
  };

  const handleViewAction = (viewId: string, action: "rename" | "duplicate" | "delete" | "up" | "down") => {
    const target = table.views.find((item) => item.id === viewId);
    if (!target) return;
    if (action === "rename") { const name = window.prompt("Rename view", target.name)?.trim(); if (name) mutateTable((current) => ({ ...current, views: current.views.map((item) => item.id === viewId ? { ...item, name } : item) })); return; }
    if (action === "duplicate") { const copy = { ...structuredClone(target), id: createId("view"), name: `${target.name} copy` }; mutateTable((current) => ({ ...current, views: [...current.views, copy] })); setState((current) => ({ ...current, activeViewId: copy.id })); return; }
    if (action === "delete") { if (table.views.length === 1 || !window.confirm(`Delete view “${target.name}”? Task records will not be deleted.`)) return; const remaining = table.views.filter((item) => item.id !== viewId); mutateTable((current) => ({ ...current, views: current.views.filter((item) => item.id !== viewId) })); if (state.activeViewId === viewId) setState((current) => ({ ...current, activeViewId: remaining[0].id })); return; }
    const index = table.views.findIndex((item) => item.id === viewId); const nextIndex = index + (action === "up" ? -1 : 1); if (nextIndex < 0 || nextIndex >= table.views.length) return; mutateTable((current) => { const views = [...current.views]; [views[index], views[nextIndex]] = [views[nextIndex], views[index]]; return { ...current, views }; });
  };

  const handleBaseAction = (baseId: string, action: "rename" | "archive") => {
    const target = workspace.bases.find((item) => item.id === baseId); if (!target) return;
    if (action === "rename") { const name = window.prompt("Rename base", target.name)?.trim(); if (name) setState((current) => ({ ...current, workspaces: current.workspaces.map((item) => item.id !== current.activeWorkspaceId ? item : { ...item, bases: item.bases.map((baseItem) => baseItem.id === baseId ? { ...baseItem, name } : baseItem) }) })); return; }
    const available = workspace.bases.filter((item) => !item.archivedAt && item.id !== baseId); if (!available.length) { setToast("Create another Base before archiving this one"); return; } if (!window.confirm(`Archive Base “${target.name}”? Its data will be preserved.`)) return; const fallback = available[0]; const fallbackTable = fallback.tables.find((item) => item.id === "table-tasks") ?? fallback.tables[0]; setState((current) => ({ ...current, workspaces: current.workspaces.map((item) => item.id !== current.activeWorkspaceId ? item : { ...item, bases: item.bases.map((baseItem) => baseItem.id === baseId ? { ...baseItem, archivedAt: new Date().toISOString() } : baseItem) }), ...(baseId === current.activeBaseId && fallbackTable ? { activeBaseId: fallback.id, activeTableId: fallbackTable.id, activeViewId: fallbackTable.views[0].id } : {}) }));
  };

  const createEntity = (name: string) => {
    if (entityDialog.kind === "workspace") {
      const newTable = createBlankTable("Start here");
      const newBaseId = createId("base");
      const workspaceId = createId("workspace");
      setState((current) => ({ ...current, workspaces: [...current.workspaces, { id: workspaceId, name, slug: name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-"), bases: [{ id: newBaseId, name: "My first base", color: "blue", tables: [newTable] }] }], activeWorkspaceId: workspaceId, activeBaseId: newBaseId, activeTableId: newTable.id, activeViewId: newTable.views[0].id }));
    } else if (entityDialog.kind === "base") {
      const newTable = createBlankTable("Start here");
      const newBaseId = createId("base");
      setState((current) => ({ ...current, workspaces: current.workspaces.map((item) => item.id === current.activeWorkspaceId ? { ...item, bases: [...item.bases, { id: newBaseId, name, color: "cyan", tables: [newTable] }] } : item), activeBaseId: newBaseId, activeTableId: newTable.id, activeViewId: newTable.views[0].id }));
    } else {
      const newTable = createBlankTable(name);
      setState((current) => ({ ...current, workspaces: current.workspaces.map((item) => item.id !== current.activeWorkspaceId ? item : { ...item, bases: item.bases.map((baseItem) => baseItem.id === current.activeBaseId ? { ...baseItem, tables: [...baseItem.tables, newTable] } : baseItem) }), activeTableId: newTable.id, activeViewId: newTable.views[0].id }));
    }
    setActiveArea("table");
    setToast(`${name} created`);
  };

  const addRecord = (initialValues: Record<string, CellValue> = {}, openDrawer = true) => {
    const record: BaseRecord = {
      id: createId("record"), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: "Hieu Nguyen", comments: 0, attachments: 0,
      values: { ...Object.fromEntries(table.fields.map((field, index) => [field.id, field.defaultValue ?? defaultForField(field, index)])), ...initialValues },
    };
    mutateTable((current) => ({ ...current, records: [...current.records, record] }));
    if (openDrawer) setDrawerRecordId(record.id);
    setToast("Record added");
  };

  const deleteRecords = (ids: Set<string>) => {
    if (ids.size === 0 || !window.confirm(`Delete ${ids.size} record${ids.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    mutateTable((current) => ({ ...current, records: current.records.filter((record) => !ids.has(record.id)) }));
    setSelection(new Set());
    if (drawerRecordId && ids.has(drawerRecordId)) setDrawerRecordId(undefined);
    setToast(`${ids.size} record${ids.size === 1 ? "" : "s"} deleted`);
  };

  const handleFieldAction = (field: FieldDefinition | undefined, action: FieldAction) => {
    if (!field && action === "insertRight") { setFieldDialog({ open: true, insertAt: table.fields.length }); return; }
    if (!field) return;
    const order = view.columnOrder.length ? [...view.columnOrder] : table.fields.map((item) => item.id);
    const index = order.indexOf(field.id);
    if (action === "edit") setFieldDialog({ open: true, field });
    if (action === "insertLeft" || action === "insertRight") setFieldDialog({ open: true, insertAt: Math.max(0, index + (action === "insertRight" ? 1 : 0)) });
    if (action === "hide") updateView({ hiddenFieldIds: [...new Set([...view.hiddenFieldIds, field.id])] });
    if (action === "freeze") updateView({ frozenFieldCount: Math.max(1, index + 1) });
    if (action === "sortAsc" || action === "sortDesc") updateView({ sorting: [{ id: createId("sort"), fieldId: field.id, direction: action === "sortAsc" ? "asc" : "desc" }] });
    if (action === "group") updateView({ groupByFieldId: field.id });
    if (action === "filter") updateView({ filters: { ...view.filters, conditions: [...view.filters.conditions, { id: createId("filter"), fieldId: field.id, operator: "notEmpty" }] } });
    if (action === "moveLeft" || action === "moveRight") {
      const nextIndex = index + (action === "moveLeft" ? -1 : 1);
      if (index >= 0 && nextIndex >= 0 && nextIndex < order.length) { [order[index], order[nextIndex]] = [order[nextIndex], order[index]]; updateView({ columnOrder: order }); }
    }
    if (action === "duplicate") {
      const duplicate = { ...field, id: createId("field"), name: `${field.name} copy`, order: field.order + 1, configuration: field.configuration ? structuredClone(field.configuration) : undefined };
      mutateTable((current) => ({ ...current, fields: insertField(current.fields, duplicate, index + 1), records: current.records.map((record) => ({ ...record, values: { ...record.values, [duplicate.id]: record.values[field.id] ?? null } })), views: current.views.map((item) => ({ ...item, columnOrder: insertId(item.columnOrder.length ? item.columnOrder : current.fields.map((entry) => entry.id), duplicate.id, index + 1) })) }));
      setToast("Field duplicated");
    }
    if (action === "delete" && window.confirm(`Delete “${field.name}” and its values? This cannot be undone.`)) {
      mutateTable((current) => ({ ...current, fields: current.fields.filter((item) => item.id !== field.id).map((item, itemIndex) => ({ ...item, order: itemIndex })), records: current.records.map((record) => { const values = { ...record.values }; delete values[field.id]; return { ...record, values }; }), views: current.views.map((item) => ({ ...item, columnOrder: item.columnOrder.filter((id) => id !== field.id), hiddenFieldIds: item.hiddenFieldIds.filter((id) => id !== field.id), groupByFieldId: item.groupByFieldId === field.id ? undefined : item.groupByFieldId, sorting: item.sorting.filter((sort) => sort.fieldId !== field.id), filters: { ...item.filters, conditions: item.filters.conditions.filter((condition) => !("fieldId" in condition) || condition.fieldId !== field.id) } })) }));
      setToast("Field deleted");
    }
  };

  const saveField = (saved: FieldDefinition) => {
    const existing = table.fields.find((field) => field.id === saved.id);
    if (existing) {
      mutateTable((current) => ({ ...current, fields: current.fields.map((field) => field.id === saved.id ? saved : field), records: existing.type === saved.type ? current.records : current.records.map((record) => ({ ...record, values: { ...record.values, [saved.id]: migrateValue(record.values[saved.id], saved.type) } })) }));
      setToast("Field updated");
    } else {
      const at = Math.max(0, Math.min(fieldDialog.insertAt ?? table.fields.length, table.fields.length));
      mutateTable((current) => ({ ...current, fields: insertField(current.fields, saved, at), records: current.records.map((record) => ({ ...record, values: { ...record.values, [saved.id]: saved.defaultValue ?? null } })), views: current.views.map((item) => ({ ...item, columnOrder: insertId(item.columnOrder.length ? item.columnOrder : current.fields.map((field) => field.id), saved.id, at) })) }));
      setToast("Field created");
    }
  };

  const createView = (created: SavedView) => {
    const withOrder = { ...created, columnOrder: table.fields.map((field) => field.id) };
    mutateTable((current) => ({ ...current, views: [...current.views, withOrder] }));
    setState((current) => ({ ...current, activeViewId: created.id }));
    setToast("View created");
  };

  const resetDemo = () => {
    if (!window.confirm("Reset the workspace to the original HR Operations demo data?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setState(structuredClone(initialAppState)); setSelection(new Set()); setDrawerRecordId(undefined); setActiveArea("table");
    setToast("Demo workspace restored");
  };

  const exportRecords = async (format: ExportFormat, scope: ExportScope) => {
    try {
      const count = await downloadRecords({ fileName: `${table.name}-${view.name}`, format, fields: table.fields, records: visibleRecords, view, selection, scope });
      setToast(`${count} record${count === 1 ? "" : "s"} exported to ${format.toUpperCase()}`);
    } catch {
      setToast("Export failed. Please try again.");
    }
  };

  return <div className="app-shell">
    <Sidebar workspaces={state.workspaces} workspace={workspace} base={base} activeWorkspaceId={workspace.id} activeBaseId={base.id} activeTableId={table.id} activeViewId={view.id} activeArea={activeArea} mobileOpen={mobileNavOpen} currentUser={currentUser} currentUserEmail={user.email} currentUserImage={user.image} onMobileClose={() => setMobileNavOpen(false)} onSelectWorkspace={switchWorkspace} onSelectBase={switchBase} onSelectView={switchView} onSelectDashboard={() => openSharedArea("dashboard")} onSelectOkrs={() => openSharedArea("okrs")} onSelectMyWork={() => openSharedArea("myWork")} onCreate={openEntityDialog} onCreateView={() => setViewDialogOpen(true)} onViewAction={handleViewAction} onBaseAction={handleBaseAction} />
    <main className="workspace-main">
      <Topbar workspaceName={workspace.name} baseName={base.name} tableName={activeArea === "dashboard" ? "Dashboard" : activeArea === "okrs" ? "Goals & OKRs" : activeArea === "myWork" ? "My Work" : table.name} search={search} onSearchChange={setSearch} onMenuOpen={() => setMobileNavOpen(true)} onToast={setToast} onQuickAdd={(kind) => { if (kind === "thought") openSharedArea("myWork"); else if (kind === "goal") openSharedArea("okrs"); else { setActiveArea("table"); addRecord(); } }} />
      {activeArea === "dashboard" ? <DashboardBuilder table={taskTable} currentUser={currentUser} dashboards={state.dashboards} activeDashboardId={state.activeDashboardId} activePageId={state.activeDashboardPageId} onChange={(dashboards) => setState((current) => ({ ...current, dashboards }))} onSelect={(activeDashboardId, activeDashboardPageId) => setState((current) => ({ ...current, activeDashboardId, activeDashboardPageId }))} /> : activeArea === "okrs" ? <OkrWorkspace store={state.okrs} tasks={taskTable.records} currentUser={currentUser} onChangeStore={(okrs) => setState((current) => ({ ...current, okrs }))} onUpdateTask={updateTask} onOpenTask={setDrawerRecordId} /> : activeArea === "myWork" ? <MyWorkHub currentUser={currentUser} tasks={taskTable.records} thoughts={state.capturedThoughts} categories={state.taskCategories} objectives={state.okrs.objectives} onCapture={captureThought} onClarifying={markThoughtClarifying} onConvert={convertThought} onOpenTask={setDrawerRecordId} onCategoriesChange={updateCategories} /> : <>
        <div className="table-titlebar"><div className="table-title-icon"><Database size={16} /></div><div><h1>{table.name}</h1><span>{table.description ?? `${table.records.length} records · ${table.fields.length} fields`}</span></div><div className="titlebar-spacer" /><span className={`sync-status save-${saveStatus}`}>{saveStatus === "saving" ? <LoaderCircle size={14} /> : saveStatus === "error" ? <AlertCircle size={14} /> : <Cloud size={14} />}{saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Saved locally"}</span><button className="reset-demo" onClick={resetDemo}><RotateCcw size={13} /> Reset demo</button></div>
        <ViewTabs views={table.views} activeViewId={view.id} onSelect={(viewId) => { setState((current) => ({ ...current, activeViewId: viewId })); setSelection(new Set()); }} onAdd={() => setViewDialogOpen(true)} />
        <ViewToolbar fields={displayFields} view={view} search={search} resultCount={visibleRecords.length} selectionCount={selection.size} onSearchChange={setSearch} onUpdateView={updateView} onExport={exportRecords} />
        {view.kind === "grid" ? <DataGrid fields={displayFields} records={visibleRecords} view={view} selection={selection} onSelectionChange={setSelection} onUpdateCell={updateCell} onOpenRecord={setDrawerRecordId} onAddRecord={() => addRecord()} onDeleteSelected={() => deleteRecords(selection)} onBulkStatus={(status) => { const selected = new Set(selection); mutateTable((current) => ({ ...current, records: current.records.map((record) => selected.has(record.id) ? { ...record, values: { ...record.values, status }, updatedAt: new Date().toISOString() } : record) })); setToast("Selected records updated"); }} onFieldAction={handleFieldAction} /> : <AlternateView view={view} records={visibleRecords} fields={displayFields} okrStore={state.okrs} onSetUrgencyRule={(urgencyDueDays) => setState((current) => ({ ...current, okrs: { ...current.okrs, urgencyDueDays } }))} onUpdateCell={updateCell} onOpenRecord={setDrawerRecordId} onCreateRecord={(values) => addRecord(values, false)} />}
        <footer className="statusbar"><span>{visibleRecords.length} of {table.records.length} records</span><span><i /> Local demo persistence</span><span>{table.fields.filter((field) => !view.hiddenFieldIds.includes(field.id)).length} visible fields</span><span className="status-spacer" /><span>{view.kind === "grid" ? "Ctrl + arrows to navigate cells" : "All views share the same records"}</span></footer>
      </>}
    </main>
    <RecordDrawer record={drawerRecord} fields={displayFields} onClose={() => setDrawerRecordId(undefined)} onUpdateCell={(fieldId, value) => drawerRecordId && updateCell(drawerRecordId, fieldId, value)} onDelete={() => drawerRecordId && deleteRecords(new Set([drawerRecordId]))} onComment={() => { if (!drawerRecordId) return; mutateTable((current) => ({ ...current, records: current.records.map((record) => record.id === drawerRecordId ? { ...record, comments: (record.comments ?? 0) + 1 } : record) })); setToast("Comment added"); }} />
    {fieldDialog.open && <FieldDialog open field={fieldDialog.field} insertAt={fieldDialog.insertAt} recordCount={table.records.length} onClose={() => setFieldDialog({ open: false })} onSave={saveField} />}
    {entityDialog.open && <CreateEntityDialog open kind={entityDialog.kind} onClose={() => setEntityDialog((current) => ({ ...current, open: false }))} onCreate={createEntity} />}
    {viewDialogOpen && <NewViewDialog open onClose={() => setViewDialogOpen(false)} onCreate={createView} />}
    {toast && <div className="toast"><Check size={15} /><span>{toast}</span></div>}
  </div>;
}

function enrichOkrFields(fields: FieldDefinition[], state: AppState) {
  const palette = ["violet", "blue", "green", "amber", "cyan", "pink"] as const;
  return fields.map((field) => {
    const entities = field.id === "objectiveId" ? state.okrs.objectives.map((objective) => ({ id: objective.id, label: objective.title })) : field.id === "keyResultId" ? state.okrs.keyResults.map((keyResult) => ({ id: keyResult.id, label: keyResult.title })) : undefined;
    if (!entities) return field;
    return { ...field, configuration: { ...field.configuration, optionValue: "id" as const, options: entities.map((entity, index) => ({ id: entity.id, label: entity.label, color: palette[index % palette.length] })) } };
  });
}

function createBlankTable(name: string): DataTable {
  const template = initialAppState.workspaces[0].bases[0].tables.find((item) => item.id === "table-tasks");
  if (!template) {
    const fieldId = createId("field"); const view = createEmptyView("All Tasks"); view.columnOrder = [fieldId];
    return { id: "table-tasks", name, icon: "check", fields: [{ id: fieldId, name: "Task Name", type: "shortText", order: 0, width: 260, visible: true, frozen: true, required: true }], records: [], views: [view] };
  }
  return { ...structuredClone(template), name: "All Tasks", records: [] };
}

function insertId(order: string[], id: string, at: number) { const next = [...order]; next.splice(at, 0, id); return next; }
function insertField(fields: FieldDefinition[], field: FieldDefinition, at: number) { const next = [...fields]; next.splice(at, 0, field); return next.map((item, index) => ({ ...item, order: index })); }

function defaultForField(field: FieldDefinition, index: number): CellValue {
  if (index === 0) return "Untitled record";
  if (field.type === "status") return field.configuration?.options?.[0]?.label ?? "Not Started";
  if (["number", "integer", "currency", "percentage", "progress", "rating", "duration"].includes(field.type)) return 0;
  if (field.type === "checkbox") return false;
  if (["multiSelect", "multiplePeople", "attachment"].includes(field.type)) return [];
  return null;
}

function migrateValue(value: CellValue | undefined, target: FieldType): CellValue {
  if (value == null || value === "") return null;
  if (["number", "integer", "currency", "percentage", "progress", "rating", "duration"].includes(target)) { const parsed = Number(Array.isArray(value) ? value[0] : value); return Number.isFinite(parsed) ? parsed : null; }
  if (target === "checkbox") return Boolean(value);
  if (["multiSelect", "multiplePeople", "attachment"].includes(target)) return Array.isArray(value) ? value.map(String) : [String(value)];
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function rewriteCategoryFilters(group: FilterGroup, renames: Map<string, string>): FilterGroup {
  return {
    ...group,
    conditions: group.conditions.map((condition) => {
      if ("conditions" in condition) return rewriteCategoryFilters(condition, renames);
      if (condition.fieldId !== "category") return condition;
      const rewrite = (value: CellValue | undefined): CellValue | undefined => Array.isArray(value)
        ? value.map((entry) => renames.get(String(entry)) ?? String(entry))
        : typeof value === "string" ? renames.get(value) ?? value : value;
      return { ...condition, value: rewrite(condition.value), secondValue: rewrite(condition.secondValue) };
    }),
  };
}

function WorkspaceSkeleton() {
  return <div className="workspace-skeleton" aria-label="Loading workspace"><aside><span /><span /><span /><span /></aside><main><header /><div /><div /><section>{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</section></main></div>;
}
