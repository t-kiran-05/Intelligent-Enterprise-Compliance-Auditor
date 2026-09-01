"use client"

import { Bell, Search, ShieldCheck } from "lucide-react"

export function TopBar({ activeCount, search, onSearch }: { activeCount: number; search: string; onSearch: (value: string) => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Clarity</span>
      </div>

      <div className="hidden min-w-0 flex-col md:flex">
        <h1 className="truncate text-sm font-semibold tracking-tight">
          Compliance Auditing
        </h1>
        <p className="truncate text-xs text-muted-foreground">
          Asynchronous contract risk analysis
        </p>
      </div>

      <div className="relative ml-auto hidden max-w-xs flex-1 items-center sm:flex">
        <Search
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search documents, clauses…"
          aria-label="Search"
          className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 sm:ml-0">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium md:flex">
          <span className="relative flex size-2">
            <span
              className={
                activeCount > 0
                  ? "absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"
                  : "hidden"
              }
            />
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{
                background:
                  activeCount > 0 ? "var(--primary)" : "var(--success)",
              }}
            />
          </span>
          {activeCount > 0
            ? `${activeCount} audit${activeCount > 1 ? "s" : ""} running`
            : "All audits idle"}
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-4" aria-hidden="true" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
