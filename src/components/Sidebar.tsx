"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  Building2,
  ClipboardCheck,
  Gauge,
  Package,
  Repeat2,
  ShieldCheck,
  Wrench,
  BarChart3,
} from "lucide-react";
import { cn } from "./ui";

type User = {
  role?: string;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/organization", label: "Organization", icon: Building2, adminOnly: true },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/allocations", label: "Allocations", icon: Repeat2 },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/audits", label: "Audits", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "ADMIN");

  return (
    <aside className="flex h-full w-full flex-col bg-[var(--sidebar)] text-white lg:w-72">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-100 ring-1 ring-teal-300/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold tracking-tight">AssetFlow</p>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">
              ERP Control
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 text-xs leading-5 text-[var(--sidebar-muted)]">
        Govern assignments, bookings, audits, and maintenance from one operational ledger.
      </div>
    </aside>
  );
}
