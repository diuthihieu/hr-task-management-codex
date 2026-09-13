"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Clock3, FilterX, RefreshCw, Users } from "lucide-react";
import type { BaseRecord, DataTable } from "@/domain/base";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  Done: "var(--success)",
  "In Progress": "var(--accent)",
  Pending: "var(--warning)",
  Blocked: "var(--danger)",
  "Not Started": "var(--muted-2)",
  Cancelled: "var(--border-strong)",
};

type DashboardFilters = { status: string; department: string; owner: string };
const emptyFilters: DashboardFilters = { status: "", department: "", owner: "" };

export function DashboardView({ table, onOpenRecord }: { table: DataTable; onOpenRecord: (recordId: string) => void }) {
  const [filters, setFilters] = useState<DashboardFilters>(() => readFilters(table.id));
  const { status, department, owner } = filters;
  useEffect(() => {
    window.localStorage.setItem(`orbit-base:dashboard:${table.id}`, JSON.stringify(filters));
  }, [filters, table.id]);
  const today = new Date().toISOString().slice(0, 10);
  const options = useMemo(() => ({
    statuses: unique(table.records, "status"),
    departments: unique(table.records, "department"),
    owners: unique(table.records, "owner"),
  }), [table.records]);
  const records = useMemo(() => table.records.filter((record) =>
    (!status || record.values.status === status) &&
    (!department || record.values.department === department) &&
    (!owner || record.values.owner === owner)
  ), [department, owner, status, table.records]);
  const active = Boolean(status || department || owner);
  const total = records.length;
  const done = records.filter((record) => record.values.status === "Done").length;
  const overdue = records.filter((record) => !["Done", "Cancelled"].includes(String(record.values.status)) && validDate(record.values.dueDate) && String(record.values.dueDate).slice(0, 10) < today).length;
  const inProgress = records.filter((record) => record.values.status === "In Progress").length;
  const averageProgress = total ? Math.round(records.reduce((sum, record) => sum + Number(record.values.progress ?? 0), 0) / total) : 0;
  const categories = countBy(records, "category").slice(0, 7);
  const statuses = countBy(records, "status");
  const upcoming = [...records].filter((record) => !["Done", "Cancelled"].includes(String(record.values.status)) && validDate(record.values.dueDate)).sort((a, b) => String(a.values.dueDate).localeCompare(String(b.values.dueDate))).slice(0, 6);
  const donut = conicSegments(statuses, total);

  return <div className="dashboard-page">
    <div className="dashboard-title"><div><span>HR OPERATIONS</span><h1>Operations dashboard</h1><p>Live metrics calculated from the shared task table.</p></div><div className="dashboard-updated"><RefreshCw size={13} /><span>Updated from Base</span></div></div>
    <section className="dashboard-filters" aria-label="Dashboard filters"><div><strong>Dashboard filters</strong><span>{total} matching records</span></div><label>Status<select aria-label="Dashboard status filter" value={status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{options.statuses.map((value) => <option key={value}>{value}</option>)}</select></label><label>Department<select aria-label="Dashboard department filter" value={department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}><option value="">All departments</option>{options.departments.map((value) => <option key={value}>{value}</option>)}</select></label><label>Owner<select aria-label="Dashboard owner filter" value={owner} onChange={(event) => setFilters((current) => ({ ...current, owner: event.target.value }))}><option value="">All owners</option>{options.owners.map((value) => <option key={value}>{value}</option>)}</select></label><Button variant="ghost" size="sm" disabled={!active} onClick={() => setFilters(emptyFilters)}><FilterX size={14} /> Clear</Button></section>
    <div className="kpi-grid">
      <Kpi label="Total tasks" value={total} detail={`${countBy(records, "category").length} active categories`} icon={Clock3} />
      <Kpi label="Completed" value={done} detail={`${total ? Math.round(done / total * 100) : 0}% completion rate`} icon={CheckCircle2} tone="success" />
      <Kpi label="In progress" value={inProgress} detail={`${averageProgress}% average progress`} icon={Users} />
      <Kpi label="Overdue" value={overdue} detail={overdue ? "Requires attention" : "No overdue work"} icon={CircleAlert} tone={overdue ? "danger" : "success"} />
    </div>
    <div className="dashboard-grid">
      <section className="chart-card span-7"><CardHeader title="Tasks by category" subtitle={`${total} records in the current dashboard slice`} /><div className="horizontal-bars">{categories.length ? categories.map((item) => <div key={item.label}><span title={item.label}>{item.label}</span><i><b style={{ width: `${(item.count / Math.max(...categories.map((entry) => entry.count))) * 100}%` }} /></i><strong>{item.count}</strong></div>) : <DashboardEmpty />}</div></section>
      <section className="chart-card span-5"><CardHeader title="Task status" subtitle="Exact distribution by workflow state" /><div className="donut-wrap">{total ? <><div className="donut" style={{ background: donut }}><span><strong>{total}</strong><small>Total tasks</small></span></div><div className="donut-legend">{statuses.map((item) => <div key={item.label}><i style={{ background: statusColors[item.label] ?? "var(--muted-2)" }} /><span>{item.label}</span><strong>{item.count}</strong></div>)}</div></> : <DashboardEmpty />}</div></section>
      <section className="chart-card span-12"><CardHeader title="Upcoming deadlines" subtitle="Open records ordered by the nearest due date" /><div className="upcoming-table"><div><span>Task</span><span>Owner</span><span>Status</span><span>Due date</span></div>{upcoming.map((record) => <button key={record.id} onClick={() => onOpenRecord(record.id)}><strong>{record.values.taskName}</strong><span>{record.values.owner}</span><span><i className="status-indicator" style={{ background: statusColors[String(record.values.status)] }} />{record.values.status}</span><time>{formatDate(record.values.dueDate)}</time></button>)}{upcoming.length === 0 && <DashboardEmpty />}</div></section>
    </div>
  </div>;
}

function Kpi({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: React.ComponentType<{ size?: number }>; tone?: "success" | "danger" }) {
  return <section className="kpi-card"><div className={`kpi-icon ${tone ?? ""}`}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><footer><small>{detail}</small></footer></section>;
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) { return <header className="card-header"><div><strong>{title}</strong><small>{subtitle}</small></div></header>; }
function DashboardEmpty() { return <div className="dashboard-empty"><strong>No matching data</strong><span>Clear or change dashboard filters.</span></div>; }
function unique(records: BaseRecord[], fieldId: string) { return [...new Set(records.map((record) => String(record.values[fieldId] ?? "")).filter(Boolean))].sort(); }
function countBy(records: BaseRecord[], fieldId: string) { return unique(records, fieldId).map((label) => ({ label, count: records.filter((record) => String(record.values[fieldId] ?? "") === label).length })).sort((a, b) => b.count - a.count); }
function validDate(value: BaseRecord["values"][string] | undefined) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(new Date(value).getTime()); }
function formatDate(value: BaseRecord["values"][string] | undefined) { return validDate(value) ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(String(value))) : "Not set"; }
function conicSegments(items: Array<{ label: string; count: number }>, total: number) {
  let cursor = 0;
  const segments = items.map((item) => { const start = cursor; cursor += total ? item.count / total * 360 : 0; return `${statusColors[item.label] ?? "var(--muted-2)"} ${start}deg ${cursor}deg`; });
  return `conic-gradient(${segments.join(", ")})`;
}

function readFilters(tableId: string): DashboardFilters {
  if (typeof window === "undefined") return emptyFilters;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`orbit-base:dashboard:${tableId}`) ?? "null") as Partial<DashboardFilters> | null;
    return { status: String(parsed?.status ?? ""), department: String(parsed?.department ?? ""), owner: String(parsed?.owner ?? "") };
  } catch {
    return emptyFilters;
  }
}
