import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, Plus, Loader2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assets")({
  head: () => ({
    meta: [{ title: "Assets — AssetFlow" }, { name: "description", content: "Asset register." }],
  }),
  component: AssetsPage,
});

const statusPill: Record<string, string> = {
  available: "bg-accent text-accent-foreground",
  allocated: "bg-primary/10 text-primary",
  under_maintenance: "bg-[oklch(0.78_0.15_75)]/20 text-[oklch(0.45_0.12_75)]",
  retired: "bg-muted text-muted-foreground",
  lost: "bg-destructive/15 text-destructive",
};

function AssetsPage() {
  const { role } = useAuth();
  const canManage = role === "admin" || role === "asset_manager";
  const [open, setOpen] = useState(false);

  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, tag, name, status, department_id, assigned_to")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle={q.data ? `${q.data.length} in register` : ""}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Register Asset
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        <SectionCard title="Register" description="All tracked assets">
          {q.isLoading ? (
            <Loading />
          ) : (q.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="No assets yet"
              description={
                canManage
                  ? "Register your first asset to start tracking allocations, bookings and maintenance."
                  : "You don't have any assets assigned yet."
              }
              action={
                canManage ? (
                  <Button size="sm" onClick={() => setOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" /> Register Asset
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Tag</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {q.data!.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 font-mono text-xs">{a.tag}</td>
                      <td className="px-3 py-2 font-medium">{a.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                            statusPill[a.status] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {open && canManage && (
        <RegisterAssetDialog
          onClose={() => setOpen(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["assets"] });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RegisterAssetDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("assets").insert({ tag, name });
      if (error) throw error;
      toast.success("Asset registered");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">Register asset</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Tag</span>
            <input
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Name</span>
            <input
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-10 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
