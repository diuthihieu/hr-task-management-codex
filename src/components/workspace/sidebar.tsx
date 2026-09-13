"use client";

import {
  BellRing,
  BookOpen,
  Boxes,
  CheckSquare2,
  ChevronDown,
  Database,
  FileClock,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Table2,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { BaseDefinition, WorkspaceDefinition } from "@/domain/base";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tableIcons = {
  check: CheckSquare2,
  users: Users,
  shield: ShieldCheck,
  book: BookOpen,
  history: History,
};

export function Sidebar({
  workspaces,
  workspace,
  base,
  activeWorkspaceId,
  activeBaseId,
  activeTableId,
  activeArea,
  mobileOpen,
  onMobileClose,
  onSelectTable,
  onSelectWorkspace,
  onSelectBase,
  onSelectDashboard,
  onSelectOkrs,
  onSelectMyWork,
  currentUser,
  currentUserEmail,
  currentUserImage,
  onCreate,
}: {
  workspaces: WorkspaceDefinition[];
  workspace: WorkspaceDefinition;
  base: BaseDefinition;
  activeWorkspaceId: string;
  activeBaseId: string;
  activeTableId: string;
  activeArea: "table" | "dashboard" | "okrs" | "myWork" | "workflow" | "templates";
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSelectTable: (id: string) => void;
  onSelectWorkspace: (id: string) => void;
  onSelectBase: (id: string) => void;
  onSelectDashboard: () => void;
  onSelectOkrs: () => void;
  onSelectMyWork: () => void;
  currentUser: string;
  currentUserEmail?: string;
  currentUserImage?: string;
  onCreate: (kind: "workspace" | "base" | "table") => void;
}) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  return (
    <aside className={cn("sidebar", mobileOpen && "sidebar-mobile-open")}>
      <div className="brand-row">
        <div className="brand-mark"><Boxes size={17} /></div>
        <span>Orbit Base</span>
        <button className="mobile-close" onClick={onMobileClose} aria-label="Close navigation"><X size={18} /></button>
      </div>

      <div className="workspace-switcher-wrap">
        <button className="workspace-switcher" onClick={() => setWorkspaceMenuOpen((open) => !open)}>
          <span className="workspace-avatar">{workspace.name[0]?.toUpperCase()}</span>
          <span className="workspace-copy"><strong>{workspace.name}</strong><small>Internal workspace</small></span>
          <ChevronDown size={15} />
        </button>
        {workspaceMenuOpen && <div className="workspace-menu">
          <small>WORKSPACES</small>
          {workspaces.map((item) => <button key={item.id} className={item.id === activeWorkspaceId ? "active" : ""} onClick={() => { onSelectWorkspace(item.id); setWorkspaceMenuOpen(false); }}><span>{item.name[0]?.toUpperCase()}</span><strong>{item.name}</strong>{item.id === activeWorkspaceId && <span>✓</span>}</button>)}
          <button onClick={() => { onCreate("workspace"); setWorkspaceMenuOpen(false); }}><Plus size={14} /><strong>Create workspace</strong></button>
        </div>}
      </div>

      <nav className="sidebar-scroll" aria-label="Workspace navigation">
        <div className="nav-section">
          <button className={cn("nav-item", activeArea === "dashboard" && "active")} onClick={onSelectDashboard}>
            <LayoutDashboard size={16} /><span>Dashboard</span>
          </button>
          <button className={cn("nav-item", activeArea === "myWork" && "active")} onClick={onSelectMyWork}><BellRing size={16} /><span>My work</span></button>
          <button className={cn("nav-item", activeArea === "okrs" && "active")} onClick={onSelectOkrs}><Target size={16} /><span>OKRs</span></button>
        </div>

        <div className="section-label">
          <span>BASES</span>
          <Button variant="ghost" size="icon" aria-label="Create base" onClick={() => onCreate("base")}><Plus size={14} /></Button>
        </div>

        {workspace.bases.map((baseItem) => <div className="base-tree" key={baseItem.id}>
          <button className={cn("base-heading", baseItem.id === activeBaseId && "active")} onClick={() => onSelectBase(baseItem.id)}><span className="base-dot" /> <strong>{baseItem.name}</strong>{baseItem.id === activeBaseId ? <ChevronDown size={14} /> : <ChevronDown size={14} className="collapsed-chevron" />}</button>
          {baseItem.id === activeBaseId && <div className="table-tree">
            {base.tables.map((table, index) => {
              const Icon = tableIcons[table.icon as keyof typeof tableIcons] ?? Table2;
              return <button key={table.id} className={cn("nav-item table-item", activeArea === "table" && table.id === activeTableId && "active")} onClick={() => onSelectTable(table.id)}><Icon size={15} /><span>{index + 1}. {table.name}</span><span className="item-hover-action">•••</span></button>;
            })}
            <button className="nav-item add-table" onClick={() => onCreate("table")}><Plus size={15} /><span>Add table</span></button>
          </div>}
        </div>)}

        <div className="section-label spaced"><span>TOOLS</span></div>
        <button className={cn("nav-item", activeArea === "workflow" && "active")}>
          <Workflow size={16} /><span>Workflows</span><span className="soon-pill">Soon</span>
        </button>
        <button className={cn("nav-item", activeArea === "templates" && "active")}>
          <Sparkles size={16} /><span>Templates</span><span className="nav-count">8</span>
        </button>
        <button className="nav-item"><FileClock size={16} /><span>Audit log</span></button>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item"><Settings size={16} /><span>Workspace settings</span></button>
        <div className="user-card">
          {currentUserImage ? <span className="user-avatar user-avatar-image" style={{ backgroundImage: `url(${currentUserImage})` }} aria-label={`${currentUser} profile photo`} /> : <span className="user-avatar">{currentUser.split(/\s+/).map((part) => part[0]).slice(-2).join("").toUpperCase()}</span>}
          <span><strong>{currentUser}</strong><small>{currentUserEmail ?? "Workspace owner"}</small></span>
          {currentUserEmail ? <button className="sign-out-button" onClick={() => signOut({ redirectTo: "/sign-in" })} aria-label="Sign out"><LogOut size={14} /></button> : <Database size={14} />}
        </div>
      </div>
    </aside>
  );
}
