import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  UserCheck,
  Wrench,
  CalendarClock,
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  Plus,
  BookOpen,
  Hammer,
} from "lucide-react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role";
import {
  assets,
  allocations,
  bookings,
  maintenanceRequests,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AssetFlow" },
      { name: "description", content: "Assets, allocations, bookings and maintenance at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { role, userName } = useRole();
  const today = new Date();

  const scopedAllocations =
    role === "employee"
      ? allocations.filter((a) => a.employee === userName)
      : allocations;
  const scopedBookings =
    role === "employee" ? bookings.filter((b) => b.bookedBy === userName) : bookings;
  const scopedMaint =
    role === "employee"
      ? maintenanceRequests.filter((m) => m.raisedBy === userName)
      : maintenanceRequests;

  const available = assets.filter((a) => a.status === "available").length;
  const allocated = scopedAllocations.filter((a) => !a.returned).length;
  const maintToday = scopedMaint.filter(
    (m) => m.status === "open" || m.status === "approved",
  ).length;
  const activeBookings = scopedBookings.filter(
    (b) => b.status === "confirmed" && new Date(b.end) >= today,
  ).length;
  const pendingTransfers = role === "employee" ? 0 : 4;

  const active = scopedAllocations.filter((a) => !a.returned);
  const overdue = active.filter((a) => new Date(a.expectedReturn) < today);
  const upcoming = active
    .filter((a) => new Date(a.expectedReturn) >= today)
    .sort(
      (a, b) => new Date(a.expectedReturn).getTime() - new Date(b.expectedReturn).getTime(),
    );

  const scopeLabel =
    role === "admin"
      ? "Organization-wide view"
      : role === "manager"
        ? "Department view"
        : "Your assets and bookings";

  return (
    <div>
      <PageHeader
        title={`Good ${greeting()}, ${userName.split(" ")[0]}`}
        subtitle={scopeLabel}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/assets">
                <Plus className="mr-1.5 h-4 w-4" /> Register Asset
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/bookings">
                <BookOpen className="mr-1.5 h-4 w-4" /> Book Resource
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/maintenance">
                <Hammer className="mr-1.5 h-4 w-4" /> Raise Maintenance
              </Link>
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Assets Available"
            value={available}
            icon={<Package className="h-4 w-4" />}
          />
          <KpiCard
            label="Assets Allocated"
            value={allocated}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <KpiCard
            label="Maintenance Today"
            value={maintToday}
            icon={<Wrench className="h-4 w-4" />}
          />
          <KpiCard
            label="Active Bookings"
            value={activeBookings}
            icon={<CalendarClock className="h-4 w-4" />}
          />
          <KpiCard
            label="Pending Transfers"
            value={pendingTransfers}
            icon={<ArrowLeftRight className="h-4 w-4" />}
          />
          <KpiCard
            label="Upcoming Returns"
            value={upcoming.length}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        {overdue.length > 0 && (
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/15 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold tracking-tight text-destructive">
                  Overdue returns ({overdue.length})
                </h2>
                <p className="text-xs text-destructive/80">
                  These assets are past their expected return date.
                </p>
              </div>
            </div>
            <ul className="divide-y divide-destructive/20 rounded-xl border border-destructive/20 bg-card">
              {overdue.map((a) => {
                const daysLate = differenceInCalendarDays(today, parseISO(a.expectedReturn));
                return (
                  <li
                    key={a.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {a.assetName}{" "}
                        <span className="text-muted-foreground">· {a.assetTag}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.employee} · {a.department}
                      </div>
                    </div>
                    <div className="hidden text-xs text-muted-foreground sm:block">
                      Expected {format(parseISO(a.expectedReturn), "MMM d")}
                    </div>
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      {daysLate}d late
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Upcoming returns"
            description="Next 30 days"
            action={
              <Link
                to="/assets"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <EmptyState label="No upcoming returns." />
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.slice(0, 6).map((a) => {
                  const days = differenceInCalendarDays(parseISO(a.expectedReturn), today);
                  return (
                    <li
                      key={a.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{a.assetName}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.employee} · {a.department}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{format(parseISO(a.expectedReturn), "MMM d")}</div>
                        <div className="text-xs text-muted-foreground">in {days}d</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Today's bookings"
            description="Rooms, vehicles and shared equipment"
            action={
              <Link
                to="/bookings"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            }
          >
            {scopedBookings.length === 0 ? (
              <EmptyState label="No bookings for today." />
            ) : (
              <ul className="divide-y divide-border">
                {scopedBookings.slice(0, 6).map((b) => (
                  <li
                    key={b.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{b.resource}</div>
                      <div className="truncate text-xs text-muted-foreground">{b.bookedBy}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {format(parseISO(b.start), "MMM d, HH:mm")}
                      </div>
                      <div className="text-xs capitalize text-muted-foreground">
                        {b.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
