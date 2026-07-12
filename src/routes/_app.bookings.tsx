import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/bookings")({
  head: () => ({ meta: [{ title: "Bookings — AssetFlow" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const q = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, resource, start_time, end_time, status")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Rooms, vehicles and shared equipment" />
      <div className="p-6">
        <SectionCard title="Schedule" description="Upcoming bookings">
          {q.isLoading ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-5 w-5" />}
              title="No bookings yet"
              description="Bookings will appear here once created."
            />
          ) : (
            <ul className="divide-y divide-border">
              {q.data!.map((b) => (
                <li
                  key={b.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.resource}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {new Date(b.start_time).toLocaleString()} –{" "}
                      {new Date(b.end_time).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize bg-primary/10 text-primary">
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
