import React from "react";
import { Bell, Search, UserCircle2 } from "lucide-react";

export default function AdminTopbar({ title = "Admin" }) {
  return (
    <header className="h-16 border-b border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] px-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cth-command-ink)]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="h-9 w-9 rounded border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] flex items-center justify-center text-[var(--cth-command-ink)]">
          <Bell size={18} />
        </button>
        <button className="h-9 w-9 rounded border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] flex items-center justify-center text-[var(--cth-command-ink)]">
          <Search size={18} />
        </button>
        <button className="h-9 w-9 rounded border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] flex items-center justify-center text-[var(--cth-command-ink)]">
          <UserCircle2 size={20} />
        </button>
      </div>
    </header>
  );
}
