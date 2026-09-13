"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
  Rows3,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { BaseRecord, CellValue, FieldDefinition, OkrStore, SavedView } from "@/domain/base";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { effectiveUrgency } from "@/lib/okr";

type Props = {
  view: SavedView;
  records: BaseRecord[];
  fields: FieldDefinition[];
  onUpdateCell: (recordId: string, fieldId: string, value: CellValue) => void;
  onOpenRecord: (recordId: string) => void;
  onCreateRecord: (values: Record<string, CellValue>) => void;
  okrStore: OkrStore;
  onSetUrgencyRule: (days: number | null) => void;
};

export function AlternateView(props: Props) {
  if (props.view.kind === "kanban") return <KanbanView {...props} />;
  if (props.view.kind === "calendar") return <CalendarView {...props} />;
  if (props.view.kind === "gantt") return <GanttView {...props} />;
  if (props.view.kind === "gallery") return <GalleryView {...props} />;
  if (props.view.kind === "form") return <FormView {...props} />;
  if (props.view.kind === "eisenhower") return <EisenhowerView {...props} />;
  return null;
}

function KanbanView({ view, records, fields, onUpdateCell, onOpenRecord }: Props) {
  const [draggingId, setDraggingId] = useState<string>();
  const groupField = fields.find((field) => field.id === view.groupByFieldId) ?? fields.find((field) => field.type === "status");
  const options = groupField?.configuration?.options ?? [];
  const ungrouped = records.filter((record) => !options.some((option) => option.label === record.values[groupField?.id ?? ""]));
  const columns = [...options, ...(ungrouped.length ? [{ id: "ungrouped", label: "Unassigned", color: "slate" as const }] : [])];

  if (!groupField || columns.length === 0) return <ViewEmpty icon={Rows3} title="Choose a group field" detail="Kanban needs a status or select field with options." />;
  return <div className="kanban-board" aria-label="Kanban board">
    {columns.map((option) => {
      const items = option.id === "ungrouped" ? ungrouped : records.filter((record) => record.values[groupField.id] === option.label);
      return <section className={cn("kanban-column", draggingId && "drop-ready")} key={option.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        const recordId = event.dataTransfer.getData("text/record-id");
        if (recordId) onUpdateCell(recordId, groupField.id, option.id === "ungrouped" ? null : option.label);
        setDraggingId(undefined);
      }}>
        <header><span className={`kanban-dot tone-${option.color}`} /><strong>{option.label}</strong><b>{items.length}</b><Button variant="ghost" size="icon" aria-label={`Add record to ${option.label}`}><Plus size={14} /></Button></header>
        <div className="kanban-cards">{items.map((record) => <article key={record.id} className={cn(draggingId === record.id && "dragging")} draggable tabIndex={0} onDragStart={(event) => { event.dataTransfer.setData("text/record-id", record.id); setDraggingId(record.id); }} onDragEnd={() => setDraggingId(undefined)} onClick={() => onOpenRecord(record.id)} onKeyDown={(event) => event.key === "Enter" && onOpenRecord(record.id)}>
          <span className="card-category">{display(record.values.category)}</span><h3>{primaryValue(record, fields)}</h3><div className="card-due"><Clock3 size={13} /> {formatDate(record.values.dueDate)}</div><Progress value={record.values.progress} /><footer><span className="mini-avatar">{initials(String(record.values.owner ?? ""))}</span><span>{display(record.values.owner)}</span><i /><span><MessageSquare size={12} />{record.comments ?? 0}</span><span><Paperclip size={12} />{record.attachments ?? 0}</span></footer>
        </article>)}</div>
      </section>;
    })}
  </div>;
}

function CalendarView({ records, fields, onUpdateCell, onOpenRecord }: Props) {
  const dueField = fields.find((field) => field.id === "dueDate") ?? fields.find((field) => field.type === "date");
  const firstDate = records.map((record) => toDate(record.values[dueField?.id ?? ""])).find(Boolean) ?? new Date();
  const [cursor, setCursor] = useState(() => new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
  const days = useMemo(() => calendarDays(cursor), [cursor]);
  if (!dueField) return <ViewEmpty icon={CalendarDays} title="No date field" detail="Add a date field to position records on the calendar." />;

  return <div className="calendar-view">
    <header className="view-surface-header"><div><span>CALENDAR</span><h2>{cursor.toLocaleDateString("en", { month: "long", year: "numeric" })}</h2></div><div className="segmented-actions"><Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>Today</Button><Button variant="secondary" size="icon" aria-label="Previous month" onClick={() => setCursor((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={15} /></Button><Button variant="secondary" size="icon" aria-label="Next month" onClick={() => setCursor((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight size={15} /></Button></div></header>
    <div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">{days.map((day) => {
      const key = isoDate(day);
      const items = records.filter((record) => String(record.values[dueField.id] ?? "").slice(0, 10) === key);
      return <section key={key} className={cn("calendar-day", day.getMonth() !== cursor.getMonth() && "outside", key === isoDate(new Date()) && "today")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const recordId = event.dataTransfer.getData("text/record-id"); if (recordId) onUpdateCell(recordId, dueField.id, key); }}>
        <time>{day.getDate()}</time><div>{items.slice(0, 3).map((record) => <button key={record.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/record-id", record.id)} onClick={() => onOpenRecord(record.id)}><span className={`status-dot status-${slug(record.values.status)}`} />{primaryValue(record, fields)}</button>)}{items.length > 3 && <small>+{items.length - 3} more</small>}</div>
      </section>;
    })}</div>
  </div>;
}

function GanttView({ records, fields, onUpdateCell, onOpenRecord }: Props) {
  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");
  const drag = useRef<{ id: string; x: number; mode: "move" | "resize" } | undefined>(undefined);
  const startField = fields.find((field) => field.id === "startDate") ?? fields.find((field) => field.type === "date");
  const dueField = fields.find((field) => field.id === "dueDate") ?? fields.filter((field) => field.type === "date")[1] ?? startField;
  const dependencyField = fields.find((field) => field.id === "dependencies" || field.type === "relationship");
  const dated = records.filter((record) => toDate(record.values[startField?.id ?? ""]) && toDate(record.values[dueField?.id ?? ""]));
  const range = ganttRange(dated, startField?.id, dueField?.id);
  const dayWidth = zoom === "day" ? 34 : zoom === "week" ? 18 : 9;
  const timelineWidth = Math.max(760, range.days * dayWidth);

  if (!startField || !dueField) return <ViewEmpty icon={Rows3} title="Schedule fields required" detail="Gantt needs start and due date fields." />;
  return <div className="gantt-view">
    <header className="view-surface-header"><div><span>GANTT</span><h2>Delivery timeline</h2><p>Drag bars to shift dates; drag the right handle to resize.</p></div><div className="gantt-zoom"><Button variant="secondary" size="icon" aria-label="Zoom out" onClick={() => setZoom((value) => value === "day" ? "week" : "month")} disabled={zoom === "month"}><ZoomOut size={15} /></Button><span>{zoom}</span><Button variant="secondary" size="icon" aria-label="Zoom in" onClick={() => setZoom((value) => value === "month" ? "week" : "day")} disabled={zoom === "day"}><ZoomIn size={15} /></Button></div></header>
    <div className="gantt-scroll"><div className="gantt-table" style={{ width: timelineWidth + 280 }}>
      <div className="gantt-head"><strong>Task / dependency</strong><div style={{ width: timelineWidth }}>{timelineTicks(range.start, range.days, zoom).map((tick) => <span key={tick.key} style={{ left: tick.offset * dayWidth }}>{tick.label}</span>)}</div></div>
      {dated.map((record) => {
        const start = toDate(record.values[startField.id]) ?? range.start;
        const due = toDate(record.values[dueField.id]) ?? start;
        const left = dateDiff(range.start, start) * dayWidth;
        const width = Math.max(dayWidth, (dateDiff(start, due) + 1) * dayWidth);
        const dependencyValue = record.values[dependencyField?.id ?? ""];
        const dependency = Array.isArray(dependencyValue) ? dependencyValue[0] : "";
        return <div className="gantt-row" key={record.id}><div className="gantt-record"><button onClick={() => onOpenRecord(record.id)}>{primaryValue(record, fields)}</button>{dependencyField && <label><Link2 size={11} /><select aria-label={`Dependency for ${primaryValue(record, fields)}`} value={String(dependency ?? "")} onChange={(event) => onUpdateCell(record.id, dependencyField.id, event.target.value ? [event.target.value] : [])}><option value="">No dependency</option>{records.filter((item) => item.id !== record.id).map((item) => <option key={item.id} value={item.id}>{primaryValue(item, fields)}</option>)}</select></label>}</div><div className="gantt-track" style={{ width: timelineWidth }}><div className="gantt-bar" draggable style={{ left, width }} onDragStart={(event) => { drag.current = { id: record.id, x: event.clientX, mode: "move" }; }} onDragEnd={(event) => {
          if (!drag.current) return;
          const delta = Math.round((event.clientX - drag.current.x) / dayWidth);
          if (delta) { onUpdateCell(record.id, startField.id, isoDate(addDays(start, delta))); onUpdateCell(record.id, dueField.id, isoDate(addDays(due, delta))); }
          drag.current = undefined;
        }}><i style={{ width: `${clampPercent(record.values.progress)}%` }} /><span>{clampPercent(record.values.progress)}%</span><button draggable aria-label={`Resize ${primaryValue(record, fields)}`} onDragStart={(event) => { event.stopPropagation(); drag.current = { id: record.id, x: event.clientX, mode: "resize" }; }} onDragEnd={(event) => {
          event.stopPropagation();
          if (!drag.current) return;
          const delta = Math.round((event.clientX - drag.current.x) / dayWidth);
          if (delta) onUpdateCell(record.id, dueField.id, isoDate(addDays(due, Math.max(delta, -dateDiff(start, due)))));
          drag.current = undefined;
        }} /></div></div></div>;
      })}
      {dated.length === 0 && <ViewEmpty icon={Rows3} title="No scheduled records" detail="Add start and due dates to show tasks on this timeline." />}
    </div></div>
  </div>;
}

function GalleryView({ records, fields, onOpenRecord }: Props) {
  if (records.length === 0) return <ViewEmpty icon={Rows3} title="No records to display" detail="Adjust this view's filters or add a record." />;
  return <div className="gallery-view">{records.map((record) => <article key={record.id} tabIndex={0} onClick={() => onOpenRecord(record.id)} onKeyDown={(event) => event.key === "Enter" && onOpenRecord(record.id)}>
    <header><span className="gallery-symbol">{initials(primaryValue(record, fields))}</span><span className={`status-badge status-${slug(record.values.status)}`}>{display(record.values.status)}</span></header><h3>{primaryValue(record, fields)}</h3><p>{display(record.values.execution ?? record.values.criteria)}</p><dl><div><dt>Owner</dt><dd>{display(record.values.owner)}</dd></div><div><dt>Due date</dt><dd>{formatDate(record.values.dueDate)}</dd></div><div><dt>Category</dt><dd>{display(record.values.category)}</dd></div></dl><Progress value={record.values.progress} />
  </article>)}</div>;
}

function FormView({ view, fields, onCreateRecord }: Props) {
  const editableFields = fields.filter((field) => !view.hiddenFieldIds.includes(field.id) && !isReadOnly(field));
  const [values, setValues] = useState<Record<string, CellValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = Object.fromEntries(editableFields.filter((field) => field.required && isEmpty(values[field.id])).map((field) => [field.id, `${field.name} is required`]));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onCreateRecord(values);
    setValues({});
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3000);
  };
  return <div className="form-view"><div className="form-intro"><span>SHARED FORM</span><h2>Add a new record</h2><p>Submissions create records in the same table and appear immediately in Grid, Kanban, Calendar, Gantt and Gallery.</p></div><form onSubmit={submit} noValidate>
    {editableFields.map((field) => <label className={cn("business-field", errors[field.id] && "invalid")} key={field.id}><span>{field.name}{field.required && <b>*</b>}<small>{field.configuration?.description}</small></span><FormField field={field} value={values[field.id]} onChange={(value) => { setValues((current) => ({ ...current, [field.id]: value })); setErrors((current) => { const next = { ...current }; delete next[field.id]; return next; }); }} />{errors[field.id] && <em>{errors[field.id]}</em>}</label>)}
    <footer><span>{submitted && <><Check size={14} /> Record submitted successfully</>}</span><Button type="submit" variant="primary">Submit record</Button></footer>
  </form></div>;
}

const eisenhowerQuadrants = [
  { id: "q1", importance: "Important", urgency: "Urgent", label: "Urgent + Important", action: "DO", tone: "danger" },
  { id: "q2", importance: "Important", urgency: "Not Urgent", label: "Important", action: "SCHEDULE", tone: "accent" },
  { id: "q3", importance: "Not Important", urgency: "Urgent", label: "Urgent", action: "DELEGATE", tone: "warning" },
  { id: "q4", importance: "Not Important", urgency: "Not Urgent", label: "Not urgent", action: "LOW PRIORITY", tone: "muted" },
] as const;

function EisenhowerView({ records, fields, onUpdateCell, onOpenRecord, okrStore, onSetUrgencyRule }: Props) {
  const [draggingId, setDraggingId] = useState<string>();
  const objectiveById = new Map(okrStore.objectives.map((objective) => [objective.id, objective.title]));
  const krById = new Map(okrStore.keyResults.map((keyResult) => [keyResult.id, keyResult.title]));
  return <div className="eisenhower-view">
    <header className="view-surface-header"><div><span>EISENHOWER MATRIX</span><h2>Focus by urgency and importance</h2><p>Drag a task between quadrants to update the shared Task record.</p></div><label className="urgency-rule">Urgency rule<select aria-label="Urgency derivation rule" value={okrStore.urgencyDueDays ?? "manual"} onChange={(event) => onSetUrgencyRule(event.target.value === "manual" ? null : Number(event.target.value))}><option value="manual">Manual fields</option><option value="3">Due within 3 days</option><option value="7">Due within 7 days</option></select></label></header>
    <div className="eisenhower-grid">{eisenhowerQuadrants.map((quadrant) => {
      const items = records.filter((record) => (record.values.importance === "Important" ? "Important" : "Not Important") === quadrant.importance && effectiveUrgency(record, okrStore.urgencyDueDays) === quadrant.urgency);
      return <section key={quadrant.id} className={`eisenhower-quadrant tone-${quadrant.tone}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        const recordId = event.dataTransfer.getData("text/record-id");
        if (!recordId) return;
        if (okrStore.urgencyDueDays != null) onSetUrgencyRule(null);
        onUpdateCell(recordId, "importance", quadrant.importance);
        onUpdateCell(recordId, "urgency", quadrant.urgency);
        setDraggingId(undefined);
      }}><header><div><strong>{quadrant.label}</strong><span>{quadrant.action}</span></div><b>{items.length}</b></header><div className="eisenhower-cards">{items.map((record) => {
        const objective = objectiveById.get(String(record.values.objectiveId ?? ""));
        const keyResult = krById.get(String(record.values.keyResultId ?? ""));
        return <article key={record.id} draggable className={cn(draggingId === record.id && "dragging")} onDragStart={(event) => { event.dataTransfer.setData("text/record-id", record.id); setDraggingId(record.id); }} onDragEnd={() => setDraggingId(undefined)} tabIndex={0} onClick={() => onOpenRecord(record.id)} onKeyDown={(event) => event.key === "Enter" && onOpenRecord(record.id)}><div><span className={`status-badge status-${slug(record.values.status)}`}>{display(record.values.status)}</span><span>{display(record.values.priority)}</span></div><h3>{primaryValue(record, fields)}</h3>{(objective || keyResult) && <p title={keyResult ?? objective}>{keyResult ?? objective}</p>}<dl><span>{initials(display(record.values.owner))}</span><dd>{display(record.values.owner)}</dd><dt><Clock3 size={11} /> {formatDate(record.values.dueDate)}</dt></dl><Progress value={record.values.progress} /></article>;
      })}{items.length === 0 && <div className="eisenhower-empty">Drop tasks here</div>}</div></section>;
    })}</div>
  </div>;
}

function FormField({ field, value, onChange }: { field: FieldDefinition; value: CellValue | undefined; onChange: (value: CellValue) => void }) {
  const common = { "aria-label": field.name, "aria-required": Boolean(field.required) };
  if (field.type === "checkbox") return <input {...common} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />;
  if (field.configuration?.options?.length) return <select {...common} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}><option value="">Select an option</option>{field.configuration.options.map((option) => <option key={option.id} value={field.configuration?.optionValue === "id" ? option.id : option.label}>{option.label}</option>)}</select>;
  if (field.type === "longText") return <textarea {...common} rows={4} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />;
  if (["multiSelect", "multiplePeople", "attachment", "relationship", "linkToRecord"].includes(field.type)) return <input {...common} value={Array.isArray(value) ? value.join(", ") : String(value ?? "")} placeholder="Separate multiple values with commas" onChange={(event) => onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} />;
  const type = field.type === "date" ? "date" : field.type === "dateTime" ? "datetime-local" : ["number", "integer", "currency", "percentage", "progress", "rating", "duration"].includes(field.type) ? "number" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text";
  return <input {...common} type={type} min={field.configuration?.min} max={field.configuration?.max} step={field.type === "integer" ? 1 : undefined} value={String(value ?? "")} onChange={(event) => onChange(type === "number" ? (event.target.value === "" ? null : Number(event.target.value)) : event.target.value)} />;
}

function Progress({ value }: { value: CellValue | undefined }) {
  const progress = clampPercent(value);
  return <div className="card-progress"><span><i style={{ width: `${progress}%` }} /></span><small>{progress}%</small></div>;
}

function ViewEmpty({ icon: Icon, title, detail }: { icon: React.ComponentType<{ size?: number }>; title: string; detail: string }) {
  return <div className="view-empty"><Icon size={24} /><strong>{title}</strong><span>{detail}</span></div>;
}

function primaryValue(record: BaseRecord, fields: FieldDefinition[]) { return display(record.values[fields[0]?.id] ?? "Untitled record"); }
function display(value: CellValue | undefined) { return value == null || value === "" ? "—" : Array.isArray(value) ? value.join(", ") || "—" : String(value); }
function clampPercent(value: CellValue | undefined) { return Math.max(0, Math.min(100, Number(value ?? 0) || 0)); }
function slug(value: CellValue | undefined) { return String(value ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function isEmpty(value: CellValue | undefined) { return value == null || value === "" || (Array.isArray(value) && value.length === 0); }
function isReadOnly(field: FieldDefinition) { return ["autoNumber", "formula", "lookup", "rollup", "createdBy", "createdTime", "modifiedBy", "modifiedTime", "button"].includes(field.type); }

function toDate(value: CellValue | undefined) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
function formatDate(value: CellValue | undefined) { const date = toDate(value); return date ? date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "No date"; }
function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function dateDiff(start: Date, end: Date) { return Math.round((new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86_400_000); }
function calendarDays(cursor: Date) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const start = addDays(first, -((first.getDay() + 6) % 7)); return Array.from({ length: 42 }, (_, index) => addDays(start, index)); }
function ganttRange(records: BaseRecord[], startId?: string, dueId?: string) {
  const dates = records.flatMap((record) => [toDate(record.values[startId ?? ""]), toDate(record.values[dueId ?? ""])]).filter((date): date is Date => Boolean(date));
  const min = dates.length ? new Date(Math.min(...dates.map((date) => date.getTime()))) : new Date();
  const max = dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : addDays(min, 30);
  const start = addDays(min, -3);
  return { start, days: Math.max(30, dateDiff(start, addDays(max, 7)) + 1) };
}
function timelineTicks(start: Date, days: number, zoom: "day" | "week" | "month") {
  const step = zoom === "day" ? 1 : zoom === "week" ? 7 : 30;
  return Array.from({ length: Math.ceil(days / step) }, (_, index) => { const offset = index * step; const date = addDays(start, offset); return { key: isoDate(date), offset, label: zoom === "day" ? String(date.getDate()) : date.toLocaleDateString("en", { month: "short", day: "numeric" }) }; });
}
