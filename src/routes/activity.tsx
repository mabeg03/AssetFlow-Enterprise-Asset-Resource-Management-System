import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Bell,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  CalendarX,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
  Package,
  Search,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role";
import { notifications as seedNotifs, activityLogs } from "@/lib/mock-data";
import type { Notification } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity & Alerts — AssetFlow" },
      { name: "description", content: "Notifications and audit trail." },
    ],
  }),
  component: Activity,
});

const iconFor = (k: Notification["kind"]) => {
  switch (k) {
    case "asset_assigned": return Package;
    case "maintenance_approved": return CheckCircle2;
    case "maintenance_rejected": return XCircle;
    case "booking_confirmed": return CalendarCheck;
    case "booking_cancelled": return CalendarX;
    case "booking_reminder": return Clock;
    case "transfer_approved": return ArrowLeftRight;
    case "overdue_return": return AlertTriangle;
    case "audit_discrepancy": return AlertTriangle;
  }
};

const toneFor = (k: Notification["kind"]) =>
  k === "overdue_return" || k === "audit_discrepancy" || k === "maintenance_rejected" || k === "booking_cancelled"
    ? "text-destructive bg-destructive/10"
    : "text-primary bg-accent";

function Activity() {
  const { role } = useRole();
  const [notifs, setNotifs] = useState(seedNotifs);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "manager" | "employee">("all");

  const unread = notifs.filter((n) => !n.read).length;

  const filteredLogs = useMemo(() => {
    const ql = q.toLowerCase();
    return activityLogs.filter(
      (l) =>
        (roleFilter === "all" || l.role === roleFilter) &&
        (!ql ||
          l.actor.toLowerCase().includes(ql) ||
          l.action.toLowerCase().includes(ql) ||
          l.target.toLowerCase().includes(ql)),
    );
  }, [q, roleFilter]);

  return (
    <div>
      <PageHeader
        title="Activity & Alerts"
        subtitle={role === "admin" ? "Notifications and full audit log" : "Your notifications"}
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotifs((ns) => ns.map((n) => ({ ...n, read: true })))}
            >
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="p-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <SectionCard
          title="Notifications"
          description={unread > 0 ? `${unread} unread` : "All caught up"}
        >
          <ul className="divide-y divide-border">
            {notifs.map((n) => {
              const Icon = iconFor(n.kind);
              return (
                <li
                  key={n.id}
                  onClick={() =>
                    setNotifs((ns) => ns.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                  }
                  className={cn(
                    "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 py-3 transition-colors hover:bg-muted/40",
                    !n.read && "bg-accent/30",
                  )}
                >
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", toneFor(n.kind))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{n.detail}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                    {formatDistanceToNow(parseISO(n.at), { addSuffix: true })}
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        {role === "admin" ? (
          <SectionCard
            title="Activity log"
            description="Who did what, and when"
            action={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search actor, action…"
                    className="h-8 w-44 pl-7 text-xs"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            }
          >
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Actor</th>
                    <th className="px-3 py-2 text-left font-medium">Action</th>
                    <th className="px-3 py-2 text-left font-medium">Target</th>
                    <th className="px-3 py-2 text-right font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium">{l.actor}</div>
                        <div className="text-[11px] capitalize text-muted-foreground">{l.role}</div>
                      </td>
                      <td className="px-3 py-2">{l.action}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.target}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {format(parseISO(l.at), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                        No matching entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Activity log" description="Admins only">
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              The full activity log is visible to administrators.
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
