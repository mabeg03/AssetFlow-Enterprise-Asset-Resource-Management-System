import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  UserCheck,
  Wrench,
  CalendarClock,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AssetFlow" },
      {
        name: "description",
        content: "Assets, allocations, bookings and maintenance at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { employee, role } = useAuth();

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [assets, allocations, bookings, maint] = await Promise.all([
        supabase.from("assets").select("id, status"),
        supabase.from("allocations").select("id, status, expected_return, actual_return_date"),
        supabase.from("bookings").select("id, status, start_time, end_time, resource, booked_by"),
        supabase.from("maintenance_requests").select("id, status"),
      ]);
      return {
        assets: assets.data ?? [],
        allocations: allocations.data ?? [],
        bookings: bookings.data ?? [],
        maintenance: maint.data ?? [],
      };
    },
  });

  const data = query.data;
  const now = new Date();

  const available = data?.assets.filter((a) => a.status === "available").length ?? 0;
  const allocated =
    data?.allocations.filter((a) => a.status === "active" && !a.actual_return_date).length ?? 0;
  const maintOpen =
    data?.maintenance.filter((m) => m.status === "open" || m.status === "approved").length ?? 0;
  const activeBookings =
    data?.bookings.filter((b) => new Date(b.end_time) >= now && b.status !== "cancelled").length ??
    0;
  const overdue =
    data?.allocations.filter(
      (a) =>
        a.status === "active" &&
        !a.actual_return_date &&
        a.expected_return &&
        new Date(a.expected_return) < now,
    ) ?? [];
  const upcomingReturns =
    data?.allocations.filter(
      (a) =>
        a.status === "active" &&
        !a.actual_return_date &&
        a.expected_return &&
        new Date(a.expected_return) >= now,
    ).length ?? 0;

  const firstName = employee?.name?.split(" ")[0] ?? "there";
  const scopeLabel = role ? `${ROLE_LABEL[role]} view` : "";

  return (
    <div>
      <PageHeader title={`Good ${greeting()}, ${firstName}`} subtitle={scopeLabel} />
      <div className="p-6 space-y-6">
        {query.isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KpiCard label="Assets Available" value={available} icon={<Package className="h-4 w-4" />} />
              <KpiCard label="Assets Allocated" value={allocated} icon={<UserCheck className="h-4 w-4" />} />
              <KpiCard label="Maintenance Open" value={maintOpen} icon={<Wrench className="h-4 w-4" />} />
              <KpiCard label="Active Bookings" value={activeBookings} icon={<CalendarClock className="h-4 w-4" />} />
              <KpiCard label="Overdue Returns" value={overdue.length} icon={<AlertTriangle className="h-4 w-4" />} tone={overdue.length > 0 ? "danger" : "default"} />
              <KpiCard label="Upcoming Returns" value={upcomingReturns} icon={<Clock className="h-4 w-4" />} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Recent bookings" description="Rooms, vehicles and shared equipment">
                {(data?.bookings.length ?? 0) === 0 ? (
                  <EmptyState
                    icon={<CalendarClock className="h-5 w-5" />}
                    title="No bookings yet"
                    description="Bookings for shared resources will appear here."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {data!.bookings.slice(0, 6).map((b) => (
                      <li key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{b.resource}</div>
                          <div className="truncate text-xs text-muted-foreground capitalize">
                            {b.status}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(b.start_time).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Maintenance queue" description="Open and approved requests">
                {(data?.maintenance.length ?? 0) === 0 ? (
                  <EmptyState
                    icon={<Wrench className="h-5 w-5" />}
                    title="No maintenance requests"
                    description="Raise a request from the Maintenance page when something needs attention."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {data!.maintenance.slice(0, 6).map((m) => (
                      <li key={m.id} className="py-2.5 text-sm">
                        <span className="capitalize text-muted-foreground">{m.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </>
        )}
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

function LoadingBlock() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
