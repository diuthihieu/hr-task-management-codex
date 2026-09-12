"use client";

import { Bell, Bot, Check, Menu, Moon, Search, Share2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function Topbar({
  workspaceName,
  baseName,
  tableName,
  search,
  onSearchChange,
  onMenuOpen,
  onToast,
}: {
  workspaceName: string;
  baseName: string;
  tableName: string;
  search: string;
  onSearchChange: (value: string) => void;
  onMenuOpen: () => void;
  onToast: (message: string) => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
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
        <Button variant="secondary" size="sm" onClick={() => onToast("Automation builder is prepared for Phase 5") }><Bot size={15} /> Automations</Button>
        <Button variant="primary" size="sm" onClick={() => onToast("Share link copied to clipboard")}><Share2 size={15} /> Share</Button>
        <span className="save-state"><Check size={13} /> Saved</span>
      </div>
    </header>
  );
}
