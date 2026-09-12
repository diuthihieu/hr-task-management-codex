"use client";

import {
  ArrowDown, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine, ArrowUp, ArrowUpDown,
  Check, ChevronDown, ChevronRight, Columns3, Copy, EyeOff, GripVertical, Hash,
  ListFilter, MoreHorizontal, Pencil, Plus, Snowflake, Trash2, Type, UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { columnResizingFeature, columnSizingFeature, createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { BaseRecord, CellValue, FieldDefinition, SavedView } from "@/domain/base";
import { getRecordFormatting, groupRecords } from "@/lib/query-engine";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type FieldAction = "edit" | "duplicate" | "hide" | "insertLeft" | "insertRight" | "freeze" | "moveLeft" | "moveRight" | "sortAsc" | "sortDesc" | "group" | "filter" | "delete";

const gridFeatures = tableFeatures({ columnSizingFeature, columnResizingFeature });
const columnHelper = createColumnHelper<typeof gridFeatures, BaseRecord>();

export function DataGrid({ fields, records, view, selection, onSelectionChange, onUpdateCell, onOpenRecord, onAddRecord, onDeleteSelected, onBulkStatus, onFieldAction }: {
  fields: FieldDefinition[];
  records: BaseRecord[];
  view: SavedView;
  selection: Set<string>;
  onSelectionChange: (selection: Set<string>) => void;
  onUpdateCell: (recordId: string, fieldId: string, value: CellValue) => void;
  onOpenRecord: (recordId: string) => void;
  onAddRecord: () => void;
  onDeleteSelected: () => void;
  onBulkStatus: (status: string) => void;
  onFieldAction: (field: FieldDefinition, action: FieldAction) => void;
}) {
  const [menuFieldId, setMenuFieldId] = useState<string>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const orderedFields = useMemo(() => {
    const visible = fields.filter((field) => field.visible && !view.hiddenFieldIds.includes(field.id));
    const order = view.columnOrder.length ? view.columnOrder : fields.map((field) => field.id);
    return [...visible].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      return (ai === -1 ? a.order : ai) - (bi === -1 ? b.order : bi);
    });
  }, [fields, view.columnOrder, view.hiddenFieldIds]);

  const columns = useMemo(() => {
    return columnHelper.columns(orderedFields.map((field) => columnHelper.accessor((record) => record.values[field.id], {
      id: field.id, header: field.name, size: field.width, minSize: 90, maxSize: 520,
    })));
  }, [orderedFields]);

  const table = useTable({ data: records, columns, features: gridFeatures, getRowId: (row) => row.id, columnResizeMode: "onChange" });
  const headerById = new Map(table.getFlatHeaders().map((header) => [header.column.id, header]));
  const groups = groupRecords(records, view.groupByFieldId);
  const allSelected = records.length > 0 && records.every((record) => selection.has(record.id));
  const statusField = fields.find((field) => field.type === "status");
  const rowHeight = view.rowHeight === "compact" ? 34 : view.rowHeight === "comfortable" ? 44 : 58;
  const frozenLeft = (index: number) => 76 + orderedFields.slice(0, index).reduce((total, field) => total + (headerById.get(field.id)?.getSize() ?? field.width), 0);
  const toggleAll = () => onSelectionChange(allSelected ? new Set() : new Set(records.map((record) => record.id)));
  const toggleRecord = (recordId: string) => {
    const next = new Set(selection);
    if (next.has(recordId)) next.delete(recordId); else next.add(recordId);
    onSelectionChange(next);
  };

  return (
    <div className="grid-region">
      <div className="grid-scroll">
        <table className="data-grid" style={{ width: table.getTotalSize() + 112 }}>
          <thead><tr>
            <th className="selection-header sticky-leading" style={{ width: 76, minWidth: 76 }}>
              <label className="grid-checkbox"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all visible records" /><span>{allSelected && <Check size={11} />}</span></label>
            </th>
            {orderedFields.map((field, index) => {
              const header = headerById.get(field.id);
              const frozen = index < view.frozenFieldCount;
              return <th key={field.id} className={cn(frozen && "frozen-column")} style={{ width: header?.getSize() ?? field.width, minWidth: header?.getSize() ?? field.width, left: frozen ? frozenLeft(index) : undefined }}>
                <div className="column-header"><FieldTypeIcon field={field} /><span className="column-name">{field.name}</span>{field.required && <span className="required-mark">*</span>}{frozen && <Snowflake size={11} className="frozen-icon" />}<button className="column-menu-trigger" aria-label={`${field.name} field menu`} onClick={() => setMenuFieldId((id) => id === field.id ? undefined : field.id)}><ChevronDown size={14} /></button></div>
                {menuFieldId === field.id && <FieldMenu first={index === 0} last={index === orderedFields.length - 1} onAction={(action) => { setMenuFieldId(undefined); onFieldAction(field, action); }} />}
                <div className="column-resizer" onMouseDown={header?.getResizeHandler()} onTouchStart={header?.getResizeHandler()} />
              </th>;
            })}
            <th className="add-column-header" style={{ width: 36, minWidth: 36 }}><button aria-label="Add field" onClick={() => onFieldAction(orderedFields.at(-1) ?? fields[0], "insertRight")}><Plus size={15} /></button></th>
          </tr></thead>
          <tbody>
            {groups.map((group) => <GroupRows key={group.key} group={group} grouped={Boolean(view.groupByFieldId)} collapsed={collapsed.has(group.key)} colSpan={orderedFields.length + 2} onToggle={() => setCollapsed((current) => { const next = new Set(current); if (next.has(group.key)) next.delete(group.key); else next.add(group.key); return next; })} renderRow={(record, rowIndex) => (
              <tr key={record.id} className={cn(selection.has(record.id) && "selected-row")} style={{ height: rowHeight, ...rowStyle(record, view, fields) }}>
                <td className="row-leading sticky-leading" style={{ width: 76, minWidth: 76 }}>
                  <GripVertical size={13} className="row-grip" />
                  <label className="grid-checkbox"><input type="checkbox" checked={selection.has(record.id)} onChange={() => toggleRecord(record.id)} aria-label={`Select row ${rowIndex + 1}`} /><span>{selection.has(record.id) ? <Check size={11} /> : rowIndex + 1}</span></label>
                  <button className="open-record" onClick={() => onOpenRecord(record.id)} aria-label="Open record"><MoreHorizontal size={14} /></button>
                </td>
                {orderedFields.map((field, columnIndex) => {
                  const frozen = columnIndex < view.frozenFieldCount;
                  const header = headerById.get(field.id);
                  return <td key={field.id} className={cn(frozen && "frozen-column")} style={{ width: header?.getSize() ?? field.width, minWidth: header?.getSize() ?? field.width, left: frozen ? frozenLeft(columnIndex) : undefined, ...cellStyle(record, field.id, view, fields) }}><CellEditor rowIndex={rowIndex} columnIndex={columnIndex} field={field} value={record.values[field.id]} onChange={(value) => onUpdateCell(record.id, field.id, value)} /></td>;
                })}
                <td className="grid-trailing" />
              </tr>
            )} />)}
            {records.length === 0 && <tr><td colSpan={orderedFields.length + 2}><div className="empty-grid"><ListFilter size={28} /><strong>No records match this view</strong><span>Adjust your filters or add a new record.</span></div></td></tr>}
            <tr className="add-record-row"><td className="sticky-leading" colSpan={1}><button onClick={onAddRecord}><Plus size={14} /> New</button></td><td colSpan={orderedFields.length + 1}><span>Press Enter after editing to keep moving</span></td></tr>
          </tbody>
        </table>
      </div>
      {selection.size > 0 && <div className="bulk-bar"><span><strong>{selection.size}</strong> selected</span>{statusField?.configuration?.options && <select defaultValue="" onChange={(event) => { if (event.target.value) onBulkStatus(event.target.value); }}><option value="" disabled>Change status…</option>{statusField.configuration.options.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}</select>}<Button variant="ghost" size="sm" onClick={() => onSelectionChange(new Set())}>Clear</Button><Button variant="danger" size="sm" onClick={onDeleteSelected}><Trash2 size={14} /> Delete</Button></div>}
    </div>
  );
}

function GroupRows({ group, grouped, collapsed, colSpan, onToggle, renderRow }: { group: { key: string; label: string; records: BaseRecord[] }; grouped: boolean; collapsed: boolean; colSpan: number; onToggle: () => void; renderRow: (record: BaseRecord, rowIndex: number) => React.ReactNode }) {
  return <>{grouped && <tr className="group-heading"><td colSpan={colSpan}><button onClick={onToggle}>{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}<span className="group-dot" /> <strong>{group.label}</strong><span>{group.records.length} records</span></button></td></tr>}{!collapsed && group.records.map(renderRow)}</>;
}

function CellEditor({ rowIndex, columnIndex, field, value, onChange }: { rowIndex: number; columnIndex: number; field: FieldDefinition; value: CellValue | undefined; onChange: (value: CellValue) => void }) {
  const readOnly = ["autoNumber", "formula", "lookup", "rollup", "createdBy", "createdTime", "modifiedBy", "modifiedTime"].includes(field.type);
  const navigation = (event: React.KeyboardEvent<HTMLElement>) => {
    const directions: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    if (!(event.key in directions) || !(event.ctrlKey || event.metaKey)) return;
    const [rowDelta, columnDelta] = directions[event.key];
    const next = document.querySelector<HTMLElement>(`[data-cell="${rowIndex + rowDelta}:${columnIndex + columnDelta}"]`);
    if (next) { event.preventDefault(); next.focus(); }
  };
  const shared = { "data-cell": `${rowIndex}:${columnIndex}`, onKeyDown: navigation };
  if (readOnly) return <span className="readonly-cell">{formatValue(value, field)}</span>;
  if (field.type === "checkbox") return <label className="cell-checkbox"><input {...shared} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><span>{Boolean(value) && <Check size={13} />}</span></label>;
  if (field.configuration?.options?.length || ["status", "singleSelect"].includes(field.type)) {
    const option = field.configuration?.options?.find((item) => item.label === value);
    return <div className={cn("select-cell", option && `tone-${option.color}`)}><span className="select-dot" /><select {...shared} aria-label={field.name} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}><option value="">—</option>{field.configuration?.options?.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}</select><ChevronDown size={12} /></div>;
  }
  if (["person", "multiplePeople"].includes(field.type)) return <div className="person-cell"><span className="mini-avatar">{initials(String(value ?? ""))}</span><input {...shared} aria-label={field.name} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} /></div>;
  if (field.type === "progress" || field.type === "percentage") {
    const numeric = Number(value ?? 0);
    return <div className="progress-cell"><span><i style={{ width: `${Math.max(0, Math.min(100, numeric))}%` }} /></span><input {...shared} aria-label={field.name} type="number" min={0} max={100} value={numeric} onChange={(event) => onChange(Number(event.target.value))} /><b>%</b></div>;
  }
  if (field.type === "date" || field.type === "dateTime") return <input {...shared} className="cell-input date-input" aria-label={field.name} type={field.type === "date" ? "date" : "datetime-local"} value={String(value ?? "").slice(0, field.type === "date" ? 10 : 16)} onChange={(event) => onChange(event.target.value)} />;
  if (["number", "integer", "currency", "rating", "duration"].includes(field.type)) return <input {...shared} className="cell-input number-input" aria-label={field.name} type="number" value={Number(value ?? 0)} onChange={(event) => onChange(Number(event.target.value))} />;
  return <input {...shared} className="cell-input" aria-label={field.name} value={Array.isArray(value) ? value.join(", ") : String(value ?? "")} onChange={(event) => onChange(event.target.value)} title={String(value ?? "")} />;
}

function FieldMenu({ first, last, onAction }: { first: boolean; last: boolean; onAction: (action: FieldAction) => void }) {
  const item = (action: FieldAction, Icon: React.ComponentType<{ size?: number }>, label: Tunes, danger = false, disabled = false) => <button className={cn(danger && "danger")} disabled={disabled} onClick={() => onAction(action)}><Icon size={14} />{label}</button>;
  return <div className="field-menu">
    {item("edit", Pencil, "Edit field")}{item("duplicate", Copy, "Duplicate field")}{item("hide", EyeOff, "Hide field")}<span />
    {item("insertLeft", ArrowLeftToLine, "Insert left")}{item("insertRight", ArrowRightToLine, "Insert right")}{item("moveLeft", ArrowUp, "Move left", false, first)}{item("moveRight", ArrowDown, "Move right", false, last)}{item("freeze", Snowflake, "Freeze up to this field")}<span />
    {item("sortAsc", ArrowDownToLine, "Sort ascending")}{item("sortDesc", ArrowUpDown, "Sort descending")}{item("group", Columns3, "Group by field")}{item("filter", ListFilter, "Filter by field")}<span />{item("delete", Trash2, "Delete field", true)}
  </div>;
}

type Tunes = string;

function FieldTypeIcon({ field }: { field: FieldDefinition }) {
  if (["number", "integer", "currency", "percentage", "progress", "rating"].includes(field.type)) return <Hash size={13} />;
  if (["person", "multiplePeople", "team"].includes(field.type)) return <UserRound size={13} />;
  return <Type size={13} />;
}

function formatValue(value: CellValue | undefined, field: FieldDefinition) {
  if (value == null) return "—";
  if (field.type === "createdTime" || field.type === "modifiedTime") return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function rowStyle(record: BaseRecord, view: SavedView, fields: FieldDefinition[]): React.CSSProperties {
  const rule = getRecordFormatting(record, view.conditionalFormatting, fields).find((item) => item.target === "row");
  return rule?.style.background ? { background: rule.style.background } : {};
}

function cellStyle(record: BaseRecord, fieldId: string, view: SavedView, fields: FieldDefinition[]): React.CSSProperties {
  const rule = getRecordFormatting(record, view.conditionalFormatting, fields).find((item) => (item.target === "cell" || item.target === "field") && item.targetFieldId === fieldId);
  return { background: rule?.style.background, color: rule?.style.foreground };
}
