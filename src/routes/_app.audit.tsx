import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit — AssetFlow" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = role === "admin" || role === "asset_manager";

  useEffect(() => {
    if (!loading && !allowed) navigate({ to: "/" });
  }, [loading, allowed, navigate]);

  const q = useQuery({
    queryKey: ["audit_cycles"],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_cycles")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!allowed) return null;

  return (
    <div>
      <PageHeader title="Audit" subtitle="Audit cycles and discrepancy reports" />
      <div className="p-6">
        <SectionCard title="Cycles">
          {q.isLoading ? (
            <div className="grid place-items-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="No audit cycles"
              description="Start an audit cycle to reconcile physical assets against the register."
            />
          ) : (
            <ul className="divide-y divide-border">
              {q.data!.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
