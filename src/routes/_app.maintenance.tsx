import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — AssetFlow" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const q = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("id, description, priority, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Requests and repairs" />
      <div className="p-6">
        <SectionCard title="Requests">
          {q.isLoading ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Wrench className="h-5 w-5" />}
              title="No maintenance requests"
              description="When someone reports an issue, it'll appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {q.data!.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 text-sm">{m.description}</div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                      {m.priority}
                    </span>
                  </div>
                  <div className="mt-1 text-xs capitalize text-muted-foreground">{m.status}</div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
