import React from "react";
import { Bell, Search, UserCircle2 } from "lucide-react";

export default function AdminTopbar({ title = "Admin" }) {
  return (
    <header className="h-16 border-b border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--cth-admin-ink)]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="h-9 w-9 rounded border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] flex items-center justify-center text-[var(--cth-admin-ink)]">
          <Bell size={18} />
        </button>
        <button className="h-9 w-9 rounded border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] flex items-center justify-center text-[var(--cth-admin-ink)]">
          <Search size={18} />
        </button>
        <button className="h-9 w-9 rounded border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] flex items-center justify-center text-[var(--cth-admin-ink)]">
          <UserCircle2 size={20} />
        </button>
      </div>
    </header>
  );
}
