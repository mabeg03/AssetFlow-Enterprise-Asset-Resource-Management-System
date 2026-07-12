import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { PageHeader, SectionCard, KpiCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — AssetFlow" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = role === "admin" || role === "asset_manager" || role === "department_head";

  useEffect(() => {
    if (!loading && !allowed) navigate({ to: "/" });
  }, [loading, allowed, navigate]);

  const q = useQuery({
    queryKey: ["reports"],
    enabled: allowed,
    queryFn: async () => {
      const [assets, maint, alloc] = await Promise.all([
        supabase.from("assets").select("status"),
        supabase.from("maintenance_requests").select("status"),
        supabase.from("allocations").select("status"),
      ]);
      return {
        totalAssets: assets.data?.length ?? 0,
        openMaint: maint.data?.filter((m) => m.status === "open").length ?? 0,
        activeAlloc: alloc.data?.filter((a) => a.status === "active").length ?? 0,
        hasAny: (assets.data?.length ?? 0) > 0,
      };
    },
  });

  if (!allowed) return null;

  return (
    <div>
      <PageHeader title="Reports" subtitle="Utilization and health at a glance" />
      <div className="p-6 space-y-6">
        {q.isLoading ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !q.data?.hasAny ? (
          <SectionCard title="Overview">
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="No data to report yet"
              description="Reports will populate once assets, allocations and maintenance activity exist."
            />
          </SectionCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="Total Assets" value={q.data.totalAssets} />
            <KpiCard label="Active Allocations" value={q.data.activeAlloc} />
            <KpiCard label="Open Maintenance" value={q.data.openMaint} />
          </div>
        )}
      </div>
    </div>
  );
}
