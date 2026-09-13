"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarClock, CheckCircle2, CircleDot, Inbox, Palette, Plus, Target, X } from "lucide-react";
import type { BaseRecord, CapturedThought, CellValue, ObjectiveDefinition, RoughTiming, TaskCategory } from "@/domain/base";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const timings: RoughTiming[] = ["Now", "Today", "Tomorrow", "This Week", "Next Week", "Later", "Someday"];
const radiusByTiming: Record<RoughTiming, number> = { Now: 8, Today: 19, Tomorrow: 30, "This Week": 43, "Next Week": 56, Later: 69, Someday: 80 };

type Clarification = {
  taskName: string; category: string; objectiveId: string; estimatedDurationMinutes: number;
  plannedStart: string; dueDate: string; status: string; output: string; process: string;
  owner: string; priority: string; notes: string;
};

export function MyWorkHub({ currentUser, tasks, thoughts, categories, objectives, onCapture, onClarifying, onConvert, onOpenTask, onCategoriesChange }: {
  currentUser: string;
  tasks: BaseRecord[];
  thoughts: CapturedThought[];
  categories: TaskCategory[];
  objectives: ObjectiveDefinition[];
  onCapture: (thought: Omit<CapturedThought, "id" | "createdAt" | "status" | "userId">) => void;
  onClarifying: (id: string) => void;
  onConvert: (thoughtId: string, values: Record<string, CellValue>) => void;
  onOpenTask: (id: string) => void;
  onCategoriesChange: (categories: TaskCategory[]) => void;
}) {
  const [tab, setTab] = useState<"capture" | "today" | "upcoming" | "tasks" | "goals" | "completed">("capture");
  const [selectedId, setSelectedId] = useState<string>();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const mine = tasks.filter((task) => task.values.owner === currentUser);
  const today = new Date().toISOString().slice(0, 10);
  const tabs = [
    ["capture", "Put All Things On", thoughts.filter((thought) => thought.status === "CAPTURED" || thought.status === "CLARIFYING").length],
    ["today", "Today", mine.filter((task) => String(task.values.dueDate ?? "").slice(0, 10) === today).length],
    ["upcoming", "Upcoming", mine.filter((task) => String(task.values.dueDate ?? "") > today && task.values.status !== "Done").length],
    ["tasks", "My Tasks", mine.length], ["goals", "My Goals", objectives.filter((goal) => goal.owner === currentUser).length],
    ["completed", "Completed", mine.filter((task) => task.values.status === "Done").length],
  ] as const;
  const selected = thoughts.find((thought) => thought.id === selectedId);

  return <div className="my-work-hub">
    <header className="my-work-hero"><div><span>PERSONAL EXECUTION</span><h1>My Work</h1><p>Capture first. Clarify when ready. Execute from one trusted Task Base.</p></div><div className="mywork-hero-actions"><Button variant="secondary" size="sm" onClick={() => setCategoriesOpen(true)}><Palette size={14} /> Categories</Button><div className="focus-summary"><CircleDot size={17} /><span><strong>{mine.filter((task) => task.values.status === "In Progress").length}</strong> in progress</span><span><strong>{mine.filter((task) => String(task.values.dueDate ?? "") < today && task.values.status !== "Done").length}</strong> overdue</span></div></div></header>
    <nav className="my-work-nav" aria-label="My Work sections">{tabs.map(([id, label, count]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{label}</span><b>{count}</b></button>)}</nav>
    {tab === "capture" ? <CaptureSpace thoughts={thoughts} categories={categories} onCapture={onCapture} onSelect={(id) => { setSelectedId(id); onClarifying(id); }} /> : tab === "goals" ? <GoalList objectives={objectives.filter((goal) => goal.owner === currentUser)} tasks={tasks} /> : <TaskSlice tab={tab} tasks={mine} today={today} onOpenTask={onOpenTask} />}
    {selected && <ClarificationPanel thought={selected} categories={categories} objectives={objectives} currentUser={currentUser} onClose={() => setSelectedId(undefined)} onSubmit={(values) => { onConvert(selected.id, values); setSelectedId(undefined); }} />}
    {categoriesOpen && <CategoryManager categories={categories} onChange={onCategoriesChange} onClose={() => setCategoriesOpen(false)} />}
  </div>;
}

function CaptureSpace({ thoughts, categories, onCapture, onSelect }: {
  thoughts: CapturedThought[]; categories: TaskCategory[];
  onCapture: (thought: Omit<CapturedThought, "id" | "createdAt" | "status" | "userId">) => void;
  onSelect: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({ taskName: "", estimatedDurationMinutes: 30, categoryId: categories[0]?.id ?? "", roughTiming: "Today" as RoughTiming });
  const visible = thoughts.filter((thought) => thought.status === "CAPTURED" || thought.status === "CLARIFYING");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!draft.taskName.trim() || !draft.categoryId || draft.estimatedDurationMinutes < 1) return; onCapture({ ...draft, taskName: draft.taskName.trim() }); setDraft((current) => ({ ...current, taskName: "" })); requestAnimationFrame(() => inputRef.current?.focus()); };
  return <div className="capture-layout">
    <section className="capture-panel"><header><div><Inbox size={17} /><span><strong>Quick capture</strong><small>Only the essentials. Press Enter to keep unloading.</small></span></div><kbd>Q</kbd></header><form onSubmit={submit}><input ref={inputRef} autoFocus aria-label="New thought" placeholder="What is on your mind?" value={draft.taskName} onChange={(event) => setDraft((current) => ({ ...current, taskName: event.target.value }))} /><div><label><span>Duration</span><input aria-label="Estimated duration in minutes" type="number" min={5} step={5} value={draft.estimatedDurationMinutes} onChange={(event) => setDraft((current) => ({ ...current, estimatedDurationMinutes: Number(event.target.value) }))} /></label><label><span>Category</span><select aria-label="Thought category" value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>{categories.filter((item) => !item.archived).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span>Rough timing</span><select aria-label="Rough timing" value={draft.roughTiming} onChange={(event) => setDraft((current) => ({ ...current, roughTiming: event.target.value as RoughTiming }))}>{timings.map((timing) => <option key={timing}>{timing}</option>)}</select></label><Button type="submit" variant="primary"><Plus size={14} /> Put thought down</Button></div></form><footer><span><i /> Color = category</span><span><i /> Size = duration</span><span><i /> Distance = timing</span></footer></section>
    <section className="thought-orbit" aria-label="Captured thought visualization"><div className="orbit-ring ring-one"><span>NOW</span></div><div className="orbit-ring ring-two"><span>TODAY</span></div><div className="orbit-ring ring-three"><span>THIS WEEK</span></div><div className="orbit-ring ring-four"><span>LATER</span></div><div className="now-core"><strong>NOW</strong><small>Current focus</small></div>{visible.map((thought, index) => { const category = categories.find((item) => item.id === thought.categoryId); const angle = ((index * 137.5 + thought.id.length * 11) % 360) * Math.PI / 180; const radius = radiusByTiming[thought.roughTiming]; const size = Math.min(58, Math.max(22, 20 + Math.sqrt(thought.estimatedDurationMinutes) * 2.4)); return <button key={thought.id} className={cn("thought-dot", thought.status === "CLARIFYING" && "clarifying")} style={{ "--dot-x": `${50 + Math.cos(angle) * radius / 2}%`, "--dot-y": `${50 + Math.sin(angle) * radius / 2}%`, "--dot-size": `${size}px`, "--dot-color": category?.color ?? "slate", "--drift": `${(index % 4) + 1}s` } as React.CSSProperties} onClick={() => onSelect(thought.id)}><span>{thought.taskName}</span><small>{category?.name} · {thought.estimatedDurationMinutes}m · {thought.roughTiming}</small></button>; })}{visible.length === 0 && <div className="orbit-empty"><CheckCircle2 size={22} /><strong>Capture inbox cleared</strong><span>Everything has been converted into actionable tasks.</span></div>}</section>
  </div>;
}

function ClarificationPanel({ thought, categories, objectives, currentUser, onClose, onSubmit }: { thought: CapturedThought; categories: TaskCategory[]; objectives: ObjectiveDefinition[]; currentUser: string; onClose: () => void; onSubmit: (values: Record<string, CellValue>) => void }) {
  const category = categories.find((item) => item.id === thought.categoryId)?.name ?? "";
  const [value, setValue] = useState<Clarification>({ taskName: thought.taskName, category, objectiveId: "", estimatedDurationMinutes: thought.estimatedDurationMinutes, plannedStart: "", dueDate: "", status: "Not Started", output: "", process: "", owner: currentUser, priority: "Medium", notes: "" });
  const [attempted, setAttempted] = useState(false);
  const valid = Boolean(value.taskName.trim() && value.category && value.plannedStart && value.dueDate && value.output.trim() && value.process.trim() && value.owner.trim());
  const update = (patch: Partial<Clarification>) => setValue((current) => ({ ...current, ...patch }));
  return <div className="clarify-backdrop" role="presentation" onMouseDown={onClose}><aside className="clarify-panel" role="dialog" aria-modal="true" aria-label={`Clarify ${thought.taskName}`} onMouseDown={(event) => event.stopPropagation()}><header><div><span>TURN THOUGHT INTO ACTION</span><h2>Clarify task</h2><p>The dot stays visible until this plan is complete.</p></div><button onClick={onClose} aria-label="Close clarification"><X size={18} /></button></header><div className="clarify-scroll">
    <Section title="WHAT"><label className="wide">Task name<input value={value.taskName} onChange={(event) => update({ taskName: event.target.value })} /></label><label>Category<select value={value.category} onChange={(event) => update({ category: event.target.value })}>{categories.filter((item) => !item.archived).map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label>Estimated duration (minutes)<input type="number" min={5} value={value.estimatedDurationMinutes} onChange={(event) => update({ estimatedDurationMinutes: Number(event.target.value) })} /></label></Section>
    <Section title="WHY"><label className="wide">Goal / objective<select value={value.objectiveId} onChange={(event) => update({ objectiveId: event.target.value })}><option value="">No goal</option>{objectives.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></Section>
    <Section title="WHEN"><label>Planned start<input type="datetime-local" value={value.plannedStart} onChange={(event) => update({ plannedStart: event.target.value })} /></label><label>Due date<input type="date" value={value.dueDate} onChange={(event) => update({ dueDate: event.target.value })} /></label></Section>
    <Section title="EXPECTED OUTPUT"><label className="wide">Deliverable<textarea rows={3} value={value.output} onChange={(event) => update({ output: event.target.value })} placeholder="What tangible result confirms completion?" /></label></Section>
    <Section title="HOW"><label className="wide">Execution plan<textarea rows={4} value={value.process} onChange={(event) => update({ process: event.target.value })} placeholder="Describe the expected process and checkpoints." /></label></Section>
    <Section title="STATUS"><label>Status<select value={value.status} onChange={(event) => update({ status: event.target.value })}>{["Not Started", "In Progress", "Pending", "Blocked"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Priority<select value={value.priority} onChange={(event) => update({ priority: event.target.value })}>{["Low", "Medium", "High", "Critical"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="wide">Owner<input value={value.owner} onChange={(event) => update({ owner: event.target.value })} /></label><label className="wide">Notes<textarea rows={2} value={value.notes} onChange={(event) => update({ notes: event.target.value })} /></label></Section>
    {attempted && !valid && <p className="clarify-error">Complete the planned start, due date, expected output, execution plan and owner.</p>}
  </div><footer><Button variant="ghost" onClick={onClose}>Keep as thought</Button><Button variant="primary" onClick={() => { setAttempted(true); if (!valid) return; onSubmit({ taskName: value.taskName.trim(), category: value.category, objectiveId: value.objectiveId || null, estimatedHours: Math.round(value.estimatedDurationMinutes / 6) / 10, startDate: value.plannedStart, dueDate: value.dueDate, status: value.status, criteria: value.output.trim(), execution: value.process.trim(), owner: value.owner.trim(), priority: value.priority, notes: value.notes, progress: 0 }); }}>Convert to task</Button></footer></aside></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="clarify-section"><h3>{title}</h3><div>{children}</div></section>; }

function TaskSlice({ tab, tasks, today, onOpenTask }: { tab: string; tasks: BaseRecord[]; today: string; onOpenTask: (id: string) => void }) {
  const records = useMemo(() => tasks.filter((task) => tab === "completed" ? task.values.status === "Done" : tab === "today" ? String(task.values.dueDate ?? "").slice(0, 10) === today : tab === "upcoming" ? String(task.values.dueDate ?? "") > today && task.values.status !== "Done" : true).sort((a, b) => String(a.values.dueDate ?? "9999").localeCompare(String(b.values.dueDate ?? "9999"))), [tab, tasks, today]);
  return <section className="my-task-slice"><header><strong>{tab === "today" ? "Today" : tab === "upcoming" ? "Upcoming" : tab === "completed" ? "Completed" : "My Tasks"}</strong><span>{records.length} tasks from the shared Task Base</span></header>{records.map((task) => <button key={task.id} onClick={() => onOpenTask(task.id)}><i className={`task-priority priority-${String(task.values.priority ?? "medium").toLowerCase()}`} /><span><strong>{String(task.values.taskName ?? "Untitled task")}</strong><small>{String(task.values.category ?? "Uncategorized")}</small></span><span>{String(task.values.status ?? "Not Started")}</span><time><CalendarClock size={13} />{String(task.values.dueDate ?? "No due date").slice(0, 10)}</time></button>)}{!records.length && <div className="work-empty"><CheckCircle2 size={22} /><strong>No tasks here</strong><span>This view updates automatically from Task Base.</span></div>}</section>;
}

function GoalList({ objectives, tasks }: { objectives: ObjectiveDefinition[]; tasks: BaseRecord[] }) { return <section className="my-goal-list"><header><strong>My Goals</strong><span>Tasks roll up without duplicating dashboard data.</span></header>{objectives.map((goal) => { const linked = tasks.filter((task) => task.values.objectiveId === goal.id); const progress = linked.length ? Math.round(linked.reduce((sum, task) => sum + Number(task.values.progress ?? 0), 0) / linked.length) : 0; return <article key={goal.id}><Target size={17} /><div><strong>{goal.title}</strong><small>{linked.length} linked tasks · due {goal.endDate}</small><span><i style={{ width: `${progress}%` }} /></span></div><b>{progress}%</b></article>; })}</section>; }

function CategoryManager({ categories, onChange, onClose }: { categories: TaskCategory[]; onChange: (categories: TaskCategory[]) => void; onClose: () => void }) {
  const move = (index: number, direction: -1 | 1) => { const nextIndex = index + direction; if (nextIndex < 0 || nextIndex >= categories.length) return; const next = [...categories]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; onChange(next.map((item, order) => ({ ...item, order }))); };
  const add = () => { const name = window.prompt("Category name")?.trim(); if (!name) return; onChange([...categories, { id: `category-${Date.now()}`, name, color: "#64748b", order: categories.length }]); };
  return <div className="category-backdrop" role="presentation" onMouseDown={onClose}><section className="category-manager" role="dialog" aria-modal="true" aria-label="Task categories" onMouseDown={(event) => event.stopPropagation()}><header><div><Palette size={16} /><span><strong>Task categories</strong><small>Dot colors inherit this configuration.</small></span></div><button onClick={onClose}><X size={17} /></button></header><div>{categories.map((category, index) => <div key={category.id} className={category.archived ? "archived" : ""}><input type="color" aria-label={`${category.name} color`} value={normalizeColor(category.color)} onChange={(event) => onChange(categories.map((item) => item.id === category.id ? { ...item, color: event.target.value } : item))} /><input aria-label="Category name" value={category.name} onChange={(event) => onChange(categories.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item))} /><button disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={index === categories.length - 1} onClick={() => move(index, 1)}>↓</button><button onClick={() => onChange(categories.map((item) => item.id === category.id ? { ...item, archived: !item.archived } : item))}>{category.archived ? "Restore" : "Archive"}</button></div>)}</div><footer><Button variant="secondary" onClick={add}><Plus size={14} /> Add category</Button><Button variant="primary" onClick={onClose}>Done</Button></footer></section></div>;
}

function normalizeColor(color: string) { const colors: Record<string, string> = { slate: "#64748b", blue: "#5b6ff2", cyan: "#3b94a3", green: "#2f8f72", amber: "#b87922", orange: "#c46632", red: "#c45151", violet: "#7461a8", pink: "#a95779" }; return colors[color] ?? (/^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b"); }
