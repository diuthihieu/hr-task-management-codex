"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Columns3, Database, FormInput, GalleryHorizontalEnd, GanttChartSquare, Grid2X2, KanbanSquare, Table2, UserRound, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { FieldDefinition, FieldType, SavedView, ViewKind } from "@/domain/base";
import { createId, fieldTypeLabels } from "@/domain/base";

export function FieldDialog({ open, field, insertAt, recordCount, onClose, onSave }: {
  open: boolean;
  field?: FieldDefinition;
  insertAt?: number;
  recordCount: number;
  onClose: () => void;
  onSave: (field: FieldDefinition) => void;
}) {
  const [name, setName] = useState(field?.name ?? "");
  const [type, setType] = useState<FieldType>(field?.type ?? "shortText");
  const [description, setDescription] = useState(field?.configuration?.description ?? "");
  const [options, setOptions] = useState(field?.configuration?.options?.map((item) => item.label).join(", ") ?? "");
  const [required, setRequired] = useState(Boolean(field?.required));
  const typeChanged = field && field.type !== type;
  const needsOptions = ["singleSelect", "multiSelect", "status"].includes(type);
  const canSubmit = name.trim().length > 0;
  const save = () => {
    if (!canSubmit) return;
    const palette = ["slate", "blue", "violet", "green", "amber", "red"] as const;
    onSave({
      id: field?.id ?? createId("field"), name: name.trim(), type,
      order: field?.order ?? insertAt ?? 0, width: field?.width ?? (type === "longText" ? 260 : 170),
      visible: field?.visible ?? true, frozen: field?.frozen ?? false, required,
      configuration: {
        ...field?.configuration,
        description: description.trim() || undefined,
        options: needsOptions ? options.split(",").map((label) => label.trim()).filter(Boolean).map((label, index) => ({ id: createId("option"), label, color: palette[index % palette.length] })) : field?.configuration?.options,
      },
    });
    onClose();
  };
  return <Modal open={open} onClose={onClose} title={field ? "Edit field" : "Create field"} description="Field definitions are shared by every view of this table.">
    <div className="dialog-body">
      <label className="form-field"><span>Field name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Review status" /></label>
      <label className="form-field"><span>Field type</span><select value={type} onChange={(event) => setType(event.target.value as FieldType)}>{Object.entries(fieldTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="form-field"><span>Description <small>Optional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Help collaborators understand this field" rows={3} /></label>
      {needsOptions && <label className="form-field"><span>Options <small>Comma separated</small></span><input value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Not Started, In Progress, Done" /></label>}
      <label className="switch-row"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /><span className="switch-control" /><span><strong>Required field</strong><small>New records must include a value</small></span></label>
      {typeChanged && <div className="migration-note"><strong>Safe type migration</strong><span>{recordCount} existing values will be normalized. Values that cannot be converted are kept empty; no source data is overwritten until you save.</span></div>}
    </div>
    <div className="dialog-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!canSubmit} onClick={save}>{field ? "Save changes" : "Create field"}</Button></div>
  </Modal>;
}

export function CreateEntityDialog({ open, kind, onClose, onCreate }: { open: boolean; kind: "workspace" | "base" | "table"; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const labels = { workspace: ["Create workspace", "A secure home for teams and bases."], base: ["Create base", "Group related tables, views and automations."], table: ["Create table", "Start with a flexible, schema-free table."] };
  const Icon = kind === "workspace" ? Users : kind === "base" ? Database : Table2;
  return <Modal open={open} onClose={onClose} title={labels[kind][0]} description={labels[kind][1]}>
    <div className="dialog-body"><div className="entity-preview"><span><Icon size={22} /></span><div><strong>{name || `Untitled ${kind}`}</strong><small>Private to your workspace until shared</small></div></div><label className="form-field"><span>Name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && name.trim()) { onCreate(name.trim()); onClose(); } }} placeholder={`${kind[0].toUpperCase()}${kind.slice(1)} name`} /></label></div>
    <div className="dialog-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={() => { onCreate(name.trim()); onClose(); }}>Create {kind}</Button></div>
  </Modal>;
}

export function NewViewDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (view: SavedView) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ViewKind>("grid");
  const [personal, setPersonal] = useState(false);
  const options = useMemo(() => [
    ["grid", "Grid", "Spreadsheet-like editing", Columns3],
    ["kanban", "Kanban", "Cards grouped by a field", KanbanSquare],
    ["calendar", "Calendar", "Records positioned by date", CalendarDays],
    ["gantt", "Gantt", "Tasks across a resizable timeline", GanttChartSquare],
    ["gallery", "Gallery", "Visual cards for record scanning", GalleryHorizontalEnd],
    ["form", "Form", "Collect records with validation", FormInput],
    ["eisenhower", "Eisenhower", "Urgency and importance quadrants", Grid2X2],
  ] as const, []);
  const submit = () => {
    if (!name.trim()) return;
    onCreate({ id: createId("view"), name: name.trim(), kind, personal, filters: { id: createId("filters"), conjunction: "and", conditions: [] }, sorting: [], hiddenFieldIds: [], columnOrder: [], frozenFieldCount: 1, rowHeight: "compact", conditionalFormatting: [] });
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Create a view" description="Each view keeps its own layout, filters, sorting and formatting.">
    <div className="dialog-body"><label className="form-field"><span>View name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Leadership priorities" /></label><div className="view-type-grid">{options.map(([value, label, detail, Icon]) => <button key={value} className={kind === value ? "active" : ""} onClick={() => setKind(value)}><Icon size={18} /><span><strong>{label}</strong><small>{detail}</small></span></button>)}</div><label className="switch-row"><input type="checkbox" checked={personal} onChange={(event) => setPersonal(event.target.checked)} /><span className="switch-control" /><span><strong>Personal view</strong><small>Only you can see this view</small></span><UserRound size={15} /></label></div>
    <div className="dialog-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim()} onClick={submit}>Create view</Button></div>
  </Modal>;
}
