"use client";

import { ArrowDownRight, ArrowUpRight, CheckCircle2, CircleAlert, Clock3, MoreHorizontal, Users } from "lucide-react";
import type { DataTable } from "@/domain/base";
import { Button } from "@/components/ui/button";

export function DashboardView({ table }: { table: DataTable }) {
  const total = table.records.length;
  const done = table.records.filter((record) => record.values.status === "Done").length;
  const overdue = table.records.filter((record) => !["Done", "Cancelled"].includes(String(record.values.status)) && String(record.values.dueDate) < "2026-09-12").length;
  const inProgress = table.records.filter((record) => record.values.status === "In Progress").length;
  const categories = [...new Set(table.records.map((record) => String(record.values.category)))].map((category) => ({ category, count: table.records.filter((record) => record.values.category === category).length })).sort((a, b) => b.count - a.count).slice(0, 7);
  const statuses = ["Done", "In Progress", "Pending", "Blocked", "Not Started"].map((status) => ({ status, count: table.records.filter((record) => record.values.status === status).length }));
  const upcoming = [...table.records].filter((record) => !["Done", "Cancelled"].includes(String(record.values.status))).sort((a, b) => String(a.values.dueDate).localeCompare(String(b.values.dueDate))).slice(0, 5);
  return <div className="dashboard-page">
    <div className="dashboard-title"><div><span>HR OPERATIONS</span><h1>Operations dashboard</h1><p>Live signal across tasks, service levels and team capacity.</p></div><div><Button variant="secondary">This month</Button><Button variant="primary">Edit dashboard</Button></div></div>
    <div className="kpi-grid">
      <Kpi label="Total tasks" value={total} detail="Across 11 categories" icon={Clock3} trend="+8.2%" positive />
      <Kpi label="Completed" value={done} detail={`${Math.round(done / total * 100)}% completion rate`} icon={CheckCircle2} trend="+12%" positive />
      <Kpi label="In progress" value={inProgress} detail="Active ownership" icon={Users} trend="On track" positive />
      <Kpi label="Overdue" value={overdue} detail="Requires attention" icon={CircleAlert} trend="-2" />
    </div>
    <div className="dashboard-grid">
      <section className="chart-card span-7"><CardHeader title="Tasks by category" subtitle="Current workload distribution" /><div className="horizontal-bars">{categories.map((item) => <div key={item.category}><span>{item.category}</span><i><b style={{ width: `${(item.count / Math.max(...categories.map((x) => x.count))) * 100}%` }} /></i><strong>{item.count}</strong></div>)}</div></section>
      <section className="chart-card span-5"><CardHeader title="Task status" subtitle="18 records in the selected period" /><div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(var(--success) 0 ${done / total * 360}deg, var(--accent) ${done / total * 360}deg ${(done + inProgress) / total * 360}deg, var(--warning) ${(done + inProgress) / total * 360}deg 280deg, var(--danger) 280deg 310deg, var(--track) 310deg)` }}><span><strong>{total}</strong><small>Total tasks</small></span></div><div className="donut-legend">{statuses.map((item, index) => <div key={item.status}><i className={`legend-${index}`} /><span>{item.status}</span><strong>{item.count}</strong></div>)}</div></div></section>
      <section className="chart-card span-12"><CardHeader title="Upcoming deadlines" subtitle="Ordered by the nearest due date" /><div className="upcoming-table"><div><span>Task</span><span>Owner</span><span>Status</span><span>Due date</span></div>{upcoming.map((record) => <div key={record.id}><strong>{record.values.taskName}</strong><span>{record.values.owner}</span><span><i className="status-indicator" />{record.values.status}</span><time>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(String(record.values.dueDate)))}</time></div>)}</div></section>
    </div>
  </div>;
}

function Kpi({ label, value, detail, icon: Icon, trend, positive }: { label: string; value: number; detail: string; icon: React.ComponentType<{ size?: number }>; trend: string; positive?: boolean }) {
  return <section className="kpi-card"><div className="kpi-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><footer><small>{detail}</small><b className={positive ? "positive" : "negative"}>{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{trend}</b></footer></section>;
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) { return <header className="card-header"><div><strong>{title}</strong><small>{subtitle}</small></div><Button variant="ghost" size="icon"><MoreHorizontal size={17} /></Button></header>; }
