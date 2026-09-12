"use client";

import { useState } from "react";
import { Activity, CalendarDays, Check, MessageSquare, Paperclip, Send, Trash2, UserPlus, X } from "lucide-react";
import type { BaseRecord, CellValue, FieldDefinition } from "@/domain/base";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export function RecordDrawer({ record, fields, onClose, onUpdateCell, onDelete, onComment }: {
  record?: BaseRecord;
  fields: FieldDefinition[];
  onClose: () => void;
  onUpdateCell: (fieldId: string, value: CellValue) => void;
  onDelete: () => void;
  onComment: () => void;
}) {
  const [tab, setTab] = useState<"comments" | "activity">("comments");
  const [comment, setComment] = useState("");
  if (!record) return null;
  const primaryField = fields[0];
  const title = String(record.values[primaryField?.id] ?? "Untitled record");
  return <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
    <aside className="record-drawer" role="dialog" aria-modal="true" aria-label={`Record: ${title}`} onMouseDown={(event) => event.stopPropagation()}>
      <header className="drawer-header"><div className="record-symbol"><Check size={18} /></div><div><span>{primaryField?.name ?? "Record"}</span><h2>{title}</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close record"><X size={18} /></Button></header>
      <div className="drawer-quick-actions"><Button variant="secondary" size="sm"><UserPlus size={14} /> Follow</Button><Button variant="secondary" size="sm"><Paperclip size={14} /> Attach</Button><span /><Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete record"><Trash2 size={16} /></Button></div>
      <div className="drawer-scroll">
        <section className="record-fields">
          {fields.filter((field) => field.visible && !["createdBy", "createdTime", "modifiedTime"].includes(field.id)).map((field) => <DrawerField key={field.id} field={field} value={record.values[field.id]} onChange={(value) => onUpdateCell(field.id, value)} />)}
        </section>
        <section className="record-meta"><div><span>Created by</span><strong><i>{initials(record.createdBy)}</i>{record.createdBy}</strong></div><div><span>Last updated</span><strong>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.updatedAt))}</strong></div></section>
        <section className="activity-section">
          <div className="drawer-tabs"><button className={tab === "comments" ? "active" : ""} onClick={() => setTab("comments")}><MessageSquare size={14} /> Comments <b>{record.comments ?? 0}</b></button><button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}><Activity size={14} /> Activity</button></div>
          {tab === "comments" ? <><div className="comment-empty"><span className="mini-avatar">HN</span><div><strong>Keep the team in sync</strong><p>Mention teammates with @ and leave context on this record.</p></div></div><div className="comment-box"><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment…" /><Button variant="primary" size="icon" disabled={!comment.trim()} onClick={() => { onComment(); setComment(""); }}><Send size={15} /></Button></div></> : <div className="timeline"><span /><div><i><CalendarDays size={13} /></i><p><strong>Record updated</strong><small>Progress, status and schedule reflect the latest grid edits.</small><time>Today, 4:30 PM</time></p></div><div><i><Check size={13} /></i><p><strong>Record created</strong><small>Created by {record.createdBy}</small><time>Aug 20, 9:00 AM</time></p></div></div>}
        </section>
      </div>
    </aside>
  </div>;
}

function DrawerField({ field, value, onChange }: { field: FieldDefinition; value: CellValue | undefined; onChange: (value: CellValue) => void }) {
  const readOnly = ["formula", "lookup", "rollup", "createdBy", "createdTime", "modifiedTime"].includes(field.type);
  let input: React.ReactNode;
  if (readOnly) input = <span className="drawer-readonly">{String(value ?? "—")}</span>;
  else if (field.configuration?.options?.length) input = <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}><option value="">—</option>{field.configuration.options.map((option) => <option key={option.id}>{option.label}</option>)}</select>;
  else if (field.type === "longText") input = <textarea rows={3} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />;
  else if (field.type === "date") input = <input type="date" value={String(value ?? "").slice(0, 10)} onChange={(event) => onChange(event.target.value)} />;
  else if (["number", "integer", "currency", "progress", "percentage"].includes(field.type)) input = <input type="number" value={Number(value ?? 0)} onChange={(event) => onChange(Number(event.target.value))} />;
  else input = <input value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />;
  return <label className="drawer-field"><span>{field.name}{field.required && <b>*</b>}</span>{input}</label>;
}
