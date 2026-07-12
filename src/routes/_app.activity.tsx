import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({ meta: [{ title: "Activity & Alerts — AssetFlow" }] }),
  component: ActivityPage,
});

function ActivityPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Activity & Alerts" subtitle="Your notifications" />
      <div className="p-6">
        <SectionCard title="Notifications">
          {q.isLoading ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title="You're all caught up"
              description="Notifications will appear here as things happen."
            />
          ) : (
            <ul className="divide-y divide-border">
              {q.data!.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
