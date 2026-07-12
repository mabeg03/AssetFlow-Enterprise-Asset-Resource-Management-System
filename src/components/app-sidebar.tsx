import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABEL, type Role } from "@/lib/auth";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
};

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assets", label: "Assets", icon: Package },
  { to: "/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  {
    to: "/audit",
    label: "Audit",
    icon: ClipboardCheck,
    roles: ["admin", "asset_manager"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["admin", "asset_manager", "department_head"],
  },
  { to: "/activity", label: "Activity & Alerts", icon: Bell },
  {
    to: "/organization",
    label: "Organization Setup",
    icon: Building2,
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { employee, role, signOut } = useAuth();
  const navigate = useNavigate();

  const items = nav.filter((n) => !n.roles || (role && n.roles.includes(role)));
  const initials = (employee?.name ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight">AssetFlow</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            ERP Module
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-4">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{employee?.name ?? "—"}</div>
            <div className="truncate text-xs text-muted-foreground">
              {role ? ROLE_LABEL[role] : ""}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}
