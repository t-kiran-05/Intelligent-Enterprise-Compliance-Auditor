"use client"

import {
  Activity,
  FileSearch,
  Gauge,
  Grid3x3,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_SECTIONS: {
  label: string
  items: { name: string; icon: typeof Activity; href: string }[]
}[] = [
  {
    label: "Workspace",
    items: [
      { name: "Overview", icon: LayoutDashboard, href: "#overview" },
      { name: "Auditing", icon: FileSearch, href: "#auditing" },
      { name: "Live Activity", icon: Activity, href: "#live-activity" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { name: "Risk Heatmap", icon: Grid3x3, href: "#risk-heatmap" },
      { name: "Compliance Scores", icon: Gauge, href: "#overview" },
      { name: "Clause Review", icon: ScrollText, href: "#clause-review" },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Clarity
          </p>
          <p className="text-[11px] text-muted-foreground">Compliance Audit</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden="true" />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mt-3 flex items-center gap-3 rounded-md bg-sidebar-accent/50 px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            AL
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              Ava Lindqvist
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Legal Operations
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
