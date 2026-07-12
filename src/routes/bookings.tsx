import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { bookings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — AssetFlow" },
      { name: "description", content: "Shared-resource bookings." },
    ],
  }),
  component: Bookings,
});

const statusPill: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary",
  pending: "bg-[oklch(0.78_0.15_75)]/20 text-[oklch(0.45_0.12_75)]",
  cancelled: "bg-destructive/15 text-destructive",
};

function Bookings() {
  return (
    <div>
      <PageHeader title="Bookings" subtitle="Rooms, vehicles and shared equipment" />
      <div className="p-6">
        <SectionCard title="Schedule" description="Upcoming bookings">
          <ul className="divide-y divide-border">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{b.resource}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {b.bookedBy} · {format(parseISO(b.start), "MMM d, HH:mm")}–
                    {format(parseISO(b.end), "HH:mm")}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                    statusPill[b.status],
                  )}
                >
                  {b.status}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
