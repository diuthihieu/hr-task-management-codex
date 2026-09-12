"use client";

import { CalendarDays, Clock3, MessageSquare, Paperclip, Plus, Sparkles } from "lucide-react";
import type { BaseRecord, CellValue, FieldDefinition, SavedView } from "@/domain/base";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export function AlternateView({ view, records, fields, onUpdateCell, onOpenRecord }: { view: SavedView; records: BaseRecord[]; fields: FieldDefinition[]; onUpdateCell: (recordId: string, fieldId: string, value: CellValue) => void; onOpenRecord: (recordId: string) => void }) {
  if (view.kind === "kanban") return <KanbanView view={view} records={records} fields={fields} onUpdateCell={onUpdateCell} onOpenRecord={onOpenRecord} />;
  return <div className="feature-stage"><div className="feature-illustration"><CalendarDays size={30} /><span /><span /></div><span className="phase-label">PHASE 3 READY</span><h2>{view.name}</h2><p>The saved view configuration and date fields are ready for the full {view.kind} renderer. Grid and Kanban are functional in this release.</p><Button variant="primary"><Sparkles size={15} /> Configure {view.kind}</Button></div>;
}

function KanbanView({ view, records, fields, onUpdateCell, onOpenRecord }: { view: SavedView; records: BaseRecord[]; fields: FieldDefinition[]; onUpdateCell: (recordId: string, fieldId: string, value: CellValue) => void; onOpenRecord: (recordId: string) => void }) {
  const groupField = fields.find((field) => field.id === view.groupByFieldId) ?? fields.find((field) => field.type === "status");
  const options = groupField?.configuration?.options ?? [];
  return <div className="kanban-board">
    {options.map((option) => {
      const items = records.filter((record) => record.values[groupField?.id ?? ""] === option.label);
      return <section className="kanban-column" key={option.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const recordId = event.dataTransfer.getData("text/record-id"); if (recordId && groupField) onUpdateCell(recordId, groupField.id, option.label); }}>
        <header><span className={`kanban-dot tone-${option.color}`} /><strong>{option.label}</strong><b>{items.length}</b><Button variant="ghost" size="icon"><Plus size={14} /></Button></header>
        <div className="kanban-cards">{items.map((record) => <article key={record.id} draggable onDragStart={(event) => event.dataTransfer.setData("text/record-id", record.id)} onClick={() => onOpenRecord(record.id)}>
          <span className="card-category">{record.values.category}</span><h3>{record.values.taskName}</h3><div className="card-due"><Clock3 size={13} /> {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(String(record.values.dueDate)))}</div><div className="card-progress"><span><i style={{ width: `${Number(record.values.progress ?? 0)}%` }} /></span><small>{record.values.progress}%</small></div><footer><span className="mini-avatar">{initials(String(record.values.owner ?? ""))}</span><span>{record.values.owner}</span><i /><span><MessageSquare size={12} />{record.comments ?? 0}</span><span><Paperclip size={12} />{record.attachments ?? 0}</span></footer>
        </article>)}</div>
      </section>;
    })}
  </div>;
}
