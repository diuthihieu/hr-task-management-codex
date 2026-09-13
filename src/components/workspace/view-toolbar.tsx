"use client";

import {
  ArrowDownAZ,
  CalendarDays,
  Check,
  ChevronDown,
  Columns3,
  Download,
  FileSpreadsheet,
  Filter,
  FormInput,
  GalleryHorizontalEnd,
  GanttChartSquare,
  Grid2X2,
  KanbanSquare,
  Layers3,
  MoreHorizontal,
  Palette,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CellValue,
  FieldDefinition,
  FilterOperator,
  SavedView,
  ViewKind,
} from "@/domain/base";
import { createId } from "@/domain/base";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExportFormat, ExportScope } from "@/lib/export";

const viewIcons: Record<ViewKind, React.ComponentType<{ size?: number }>> = {
  grid: Table2,
  kanban: KanbanSquare,
  calendar: CalendarDays,
  gantt: GanttChartSquare,
  gallery: GalleryHorizontalEnd,
  form: FormInput,
  eisenhower: Grid2X2,
};

export function ViewTabs({
  views,
  activeViewId,
  onSelect,
  onAdd,
}: {
  views: SavedView[];
  activeViewId: string;
  onSelect: (viewId: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="view-tabs-row">
      <div className="view-tabs-scroll">
        {views.map((view) => {
          const Icon = viewIcons[view.kind];
          return (
            <button key={view.id} className={cn("view-tab", view.id === activeViewId && "active")} onClick={() => onSelect(view.id)}>
              <Icon size={14} /><span>{view.name}</span>{view.personal && <span className="private-dot" title="Personal view" />}
            </button>
          );
        })}
        <button className="view-tab add-view" onClick={onAdd}><Plus size={14} /> Add view</button>
      </div>
      <Button variant="ghost" size="icon" aria-label="View menu"><MoreHorizontal size={17} /></Button>
    </div>
  );
}

type Panel = "filter" | "sort" | "group" | "format" | "fields" | "density" | "export" | null;

export function ViewToolbar({
  fields,
  view,
  search,
  resultCount,
  selectionCount,
  onSearchChange,
  onUpdateView,
  onExport,
}: {
  fields: FieldDefinition[];
  view: SavedView;
  search: string;
  resultCount: number;
  selectionCount: number;
  onSearchChange: (value: string) => void;
  onUpdateView: (patch: Partial<SavedView>) => void;
  onExport: (format: ExportFormat, scope: ExportScope) => void;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const activeFilters = view.filters.conditions.length;
  const activeSorts = view.sorting.length;
  const hidden = view.hiddenFieldIds.length;
  const visibleFields = useMemo(() => fields.filter((field) => !view.hiddenFieldIds.includes(field.id)), [fields, view.hiddenFieldIds]);

  const toggle = (target: Panel) => setPanel((current) => current === target ? null : target);
  return (
    <div className="toolbar-shell">
      <div className="view-toolbar">
        <div className="toolbar-actions">
          <ToolbarButton icon={Filter} label="Filter" count={activeFilters || undefined} active={panel === "filter"} emphasized={activeFilters > 0} onClick={() => toggle("filter")} />
          <ToolbarButton icon={ArrowDownAZ} label="Sort" count={activeSorts || undefined} active={panel === "sort"} emphasized={activeSorts > 0} onClick={() => toggle("sort")} />
          <ToolbarButton icon={Layers3} label="Group" count={view.groupByFieldId ? 1 : undefined} active={panel === "group"} emphasized={Boolean(view.groupByFieldId)} onClick={() => toggle("group")} />
          <ToolbarButton icon={Columns3} label="Fields" count={hidden || undefined} active={panel === "fields"} onClick={() => toggle("fields")} />
          <ToolbarButton icon={Palette} label="Formatting" count={view.conditionalFormatting.length || undefined} active={panel === "format"} emphasized={view.conditionalFormatting.length > 0} onClick={() => toggle("format")} />
          <span className="toolbar-divider" />
          <ToolbarButton icon={Rows3} label="Row height" active={panel === "density"} onClick={() => toggle("density")} />
          <ToolbarButton icon={Download} label="Export" active={panel === "export"} onClick={() => toggle("export")} />
        </div>
        <div className="table-search">
          <Search size={14} />
          <input aria-label="Search current table" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Find in view" />
          {search && <button aria-label="Clear search" onClick={() => onSearchChange("")}><X size={13} /></button>}
          <span>{resultCount} records</span>
        </div>
      </div>

      {panel && (
        <div className="config-panel">
          <div className="panel-heading">
            <div>
              <strong>{panel === "fields" ? "Visible fields" : panel === "format" ? "Conditional formatting" : panel === "density" ? "Row height" : panel === "export" ? "Export records" : `${panel[0].toUpperCase()}${panel.slice(1)} records`}</strong>
              <small>Saved to this view only</small>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPanel(null)} aria-label="Close configuration"><X size={16} /></Button>
          </div>

          {panel === "fields" && (
            <div className="panel-list">
              {fields.map((field) => {
                const checked = !view.hiddenFieldIds.includes(field.id);
                return <label className="check-row" key={field.id}><input type="checkbox" checked={checked} onChange={() => onUpdateView({ hiddenFieldIds: checked ? [...view.hiddenFieldIds, field.id] : view.hiddenFieldIds.filter((id) => id !== field.id) })} /><span className="custom-check">{checked && <Check size={12} />}</span><span>{field.name}</span><small>{field.type}</small></label>;
              })}
            </div>
          )}

          {panel === "filter" && (
            <FilterPanel fields={visibleFields} view={view} onUpdateView={onUpdateView} />
          )}

          {panel === "sort" && (
            <div className="panel-body">
              {view.sorting.map((rule) => (
                <div className="rule-row" key={rule.id}>
                  <select value={rule.fieldId} onChange={(event) => onUpdateView({ sorting: view.sorting.map((item) => item.id === rule.id ? { ...item, fieldId: event.target.value } : item) })}>{visibleFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select>
                  <select value={rule.direction} onChange={(event) => onUpdateView({ sorting: view.sorting.map((item) => item.id === rule.id ? { ...item, direction: event.target.value as "asc" | "desc" } : item) })}><option value="asc">A → Z</option><option value="desc">Z → A</option></select>
                  <Button variant="ghost" size="icon" onClick={() => onUpdateView({ sorting: view.sorting.filter((item) => item.id !== rule.id) })}><Trash2 size={15} /></Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" disabled={!visibleFields[0]} onClick={() => onUpdateView({ sorting: [...view.sorting, { id: createId("sort"), fieldId: visibleFields[0]?.id ?? "", direction: "asc" }] })}><Plus size={14} /> Add sort</Button>
            </div>
          )}

          {panel === "group" && (
            <div className="panel-body">
              <label className="field-label">Group records by</label>
              <select className="wide-select" value={view.groupByFieldId ?? ""} onChange={(event) => onUpdateView({ groupByFieldId: event.target.value || undefined })}>
                <option value="">No grouping</option>
                {visibleFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
              </select>
              <p className="panel-note">Groups are collapsible and show live record counts.</p>
            </div>
          )}

          {panel === "format" && (
            <FormattingPanel fields={visibleFields} view={view} onUpdateView={onUpdateView} />
          )}

          {panel === "density" && (
            <div className="density-options">
              {(["compact", "comfortable", "tall"] as const).map((height) => (
                <button key={height} className={cn(view.rowHeight === height && "active")} onClick={() => onUpdateView({ rowHeight: height })}>
                  <span className={`density-preview ${height}`} />
                  <span><strong>{height[0].toUpperCase() + height.slice(1)}</strong><small>{height === "compact" ? "32 px" : height === "comfortable" ? "42 px" : "56 px"}</small></span>
                  {view.rowHeight === height && <Check size={15} />}
                </button>
              ))}
            </div>
          )}

          {panel === "export" && (
            <div className="export-panel">
              <div><FileSpreadsheet size={20} /><span><strong>Current filtered view</strong><small>{resultCount} records · visible fields only</small></span><Button variant="secondary" size="sm" onClick={() => onExport("csv", "current")}>CSV</Button><Button variant="secondary" size="sm" onClick={() => onExport("xlsx", "current")}>XLSX</Button></div>
              <div className={selectionCount ? "" : "disabled-row"}><Download size={20} /><span><strong>Selected records</strong><small>{selectionCount ? `${selectionCount} selected · visible fields only` : "Select rows in Grid to enable"}</small></span><Button variant="secondary" size="sm" disabled={!selectionCount} onClick={() => onExport("csv", "selected")}>CSV</Button><Button variant="secondary" size="sm" disabled={!selectionCount} onClick={() => onExport("xlsx", "selected")}>XLSX</Button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, count, active, emphasized, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; count?: number; active?: boolean; emphasized?: boolean; onClick: () => void }) {
  return <button className={cn("toolbar-button", active && "active", emphasized && "emphasized")} onClick={onClick}><Icon size={14} /><span>{label}</span>{count !== undefined && <b>{count}</b>}<ChevronDown size={12} /></button>;
}

function FilterPanel({ fields, view, onUpdateView }: { fields: FieldDefinition[]; view: SavedView; onUpdateView: (patch: Partial<SavedView>) => void }) {
  const updateCondition = (id: string, patch: Record<string, unknown>) => onUpdateView({
    filters: { ...view.filters, conditions: view.filters.conditions.map((item) => "fieldId" in item && item.id === id ? { ...item, ...patch } : item) },
  });
  return (
    <div className="panel-body">
      <div className="conjunction-row"><span>Match</span><select value={view.filters.conjunction} onChange={(event) => onUpdateView({ filters: { ...view.filters, conjunction: event.target.value as "and" | "or" } })}><option value="and">all conditions</option><option value="or">any condition</option></select></div>
      {view.filters.conditions.map((condition, index) => {
        if (!("fieldId" in condition)) return null;
        const field = fields.find((item) => item.id === condition.fieldId) ?? fields[0];
        const operators = getOperators(field);
        return (
          <div className="filter-rule" key={condition.id}>
            <span className="rule-prefix">{index === 0 ? "Where" : view.filters.conjunction.toUpperCase()}</span>
            <select value={condition.fieldId} onChange={(event) => updateCondition(condition.id, { fieldId: event.target.value, value: "" })}>{fields.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value as FilterOperator })}>{operators.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            {!(["empty", "notEmpty", "today", "thisWeek", "thisMonth"] as FilterOperator[]).includes(condition.operator) && <ValueInput field={field} value={condition.value} onChange={(value) => updateCondition(condition.id, { value })} />}
            <Button variant="ghost" size="icon" onClick={() => onUpdateView({ filters: { ...view.filters, conditions: view.filters.conditions.filter((item) => item.id !== condition.id) } })}><Trash2 size={14} /></Button>
          </div>
        );
      })}
      <Button variant="secondary" size="sm" disabled={!fields[0]} onClick={() => onUpdateView({ filters: { ...view.filters, conditions: [...view.filters.conditions, { id: createId("filter"), fieldId: fields[0]?.id ?? "", operator: "contains", value: "" }] } })}><Plus size={14} /> Add condition</Button>
    </div>
  );
}

function ValueInput({ field, value, onChange }: { field?: FieldDefinition; value: CellValue | undefined; onChange: (value: CellValue) => void }) {
  if (field?.configuration?.options?.length) {
    return <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}><option value="">Choose…</option>{field.configuration.options.map((option) => <option key={option.id} value={field.configuration?.optionValue === "id" ? option.id : option.label}>{option.label}</option>)}</select>;
  }
  return <input type={["number", "integer", "currency", "percentage", "progress"].includes(field?.type ?? "") ? "number" : field?.type === "date" ? "date" : "text"} value={String(value ?? "")} onChange={(event) => onChange(event.target.type === "number" ? Number(event.target.value) : event.target.value)} placeholder="Enter a value" />;
}

function FormattingPanel({ fields, view, onUpdateView }: { fields: FieldDefinition[]; view: SavedView; onUpdateView: (patch: Partial<SavedView>) => void }) {
  const defaultField = fields.find((field) => field.type === "status") ?? fields[0];
  const addRule = () => {
    if (!defaultField) return;
    onUpdateView({ conditionalFormatting: [...view.conditionalFormatting, {
      id: createId("format"), name: `${defaultField.name} highlight`, target: "row", enabled: true,
      style: { background: "var(--format-amber)" },
      conditions: { id: createId("format-group"), conjunction: "and", conditions: [{ id: createId("format-condition"), fieldId: defaultField.id, operator: "equals", value: defaultField.configuration?.options?.[0]?.label ?? "" }] },
    }] });
  };
  return (
    <div className="panel-body">
      {view.conditionalFormatting.map((rule) => {
        const condition = rule.conditions.conditions[0];
        const fieldId = condition && "fieldId" in condition ? condition.fieldId : fields[0]?.id;
        const field = fields.find((item) => item.id === fieldId);
        return (
          <div className="format-rule" key={rule.id}>
            <button className={cn("rule-toggle", rule.enabled && "on")} onClick={() => onUpdateView({ conditionalFormatting: view.conditionalFormatting.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item) })}><span /></button>
            <span className="format-swatch" style={{ background: rule.style.background ?? "var(--format-amber)" }} />
            <span><strong>{rule.name}</strong><small>{field?.name ?? "Field"} · {rule.target}</small></span>
            <Button variant="ghost" size="icon" onClick={() => onUpdateView({ conditionalFormatting: view.conditionalFormatting.filter((item) => item.id !== rule.id) })}><Trash2 size={14} /></Button>
          </div>
        );
      })}
      <Button variant="secondary" size="sm" onClick={addRule}><Plus size={14} /> Add rule</Button>
      <p className="panel-note"><SlidersHorizontal size={13} /> Rules evaluate against the filtered row value and can target rows or individual cells.</p>
    </div>
  );
}

function getOperators(field?: FieldDefinition): Array<[FilterOperator, string]> {
  if (!field) return [["contains", "contains"]];
  if (["number", "integer", "currency", "percentage", "progress", "rating"].includes(field.type)) return [["equals", "="], ["notEquals", "≠"], ["gt", ">"], ["gte", "≥"], ["lt", "<"], ["lte", "≤"], ["between", "between"], ["empty", "is empty"]];
  if (["date", "dateTime", "createdTime", "modifiedTime"].includes(field.type)) return [["before", "is before"], ["after", "is after"], ["today", "is today"], ["thisWeek", "is this week"], ["thisMonth", "is this month"], ["empty", "is empty"]];
  if (["singleSelect", "status", "person", "team"].includes(field.type)) return [["equals", "is"], ["notEquals", "is not"], ["empty", "is empty"], ["notEmpty", "is not empty"]];
  return [["contains", "contains"], ["notContains", "does not contain"], ["equals", "equals"], ["notEquals", "does not equal"], ["empty", "is empty"], ["notEmpty", "is not empty"]];
}
