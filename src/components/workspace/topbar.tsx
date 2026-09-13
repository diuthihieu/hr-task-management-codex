"use client";

import { Bell, Check, Menu, Moon, Plus, Search, Share2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function Topbar({
  workspaceName,
  baseName,
  tableName,
  search,
  onSearchChange,
  onMenuOpen,
  onToast,
  onQuickAdd,
}: {
  workspaceName: string;
  baseName: string;
  tableName: string;
  search: string;
  onSearchChange: (value: string) => void;
  onMenuOpen: () => void;
  onToast: (message: string) => void;
  onQuickAdd: (kind: "task" | "thought" | "goal") => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <Button className="mobile-menu" variant="ghost" size="icon" onClick={onMenuOpen} aria-label="Open navigation"><Menu size={18} /></Button>
        <span>{workspaceName}</span><b>/</b><span>{baseName}</span><b>/</b><strong>{tableName}</strong>
      </div>
      <div className="top-actions">
        <label className="global-search">
          <Search size={15} />
          <input ref={searchRef} value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search records…" />
          <kbd>⌘ K</kbd>
        </label>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications"><Bell size={17} /><span className="notification-dot" /></Button>
        <div className="quick-add-wrap"><Button variant="secondary" size="sm" onClick={() => setQuickOpen((open) => !open)}><Plus size={15} /> Quick add</Button>{quickOpen && <div className="quick-add-menu"><button onClick={() => { onQuickAdd("task"); setQuickOpen(false); }}><strong>New Task</strong><small>Open a structured task</small></button><button onClick={() => { onQuickAdd("thought"); setQuickOpen(false); }}><strong>Put Thought Down</strong><small>Fast brain-dump capture</small></button><button onClick={() => { onQuickAdd("goal"); setQuickOpen(false); }}><strong>New Goal</strong><small>Plan an objective</small></button></div>}</div>
        <Button variant="primary" size="sm" onClick={() => onToast("Share link copied to clipboard")}><Share2 size={15} /> Share</Button>
        <span className="save-state"><Check size={13} /> Saved</span>
      </div>
    </header>
  );
}
