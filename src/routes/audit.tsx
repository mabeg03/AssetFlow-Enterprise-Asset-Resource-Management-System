import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { auditItems } from "@/lib/mock-data";
import { summarizeAuditDiscrepancies } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit — AssetFlow" },
      { name: "description", content: "Audit cycles and discrepancy reports." },
    ],
  }),
  component: Audit,
});

const statusPill: Record<string, string> = {
  missing: "bg-destructive/15 text-destructive",
  misplaced: "bg-[oklch(0.78_0.15_75)]/20 text-[oklch(0.45_0.12_75)]",
  damaged: "bg-destructive/15 text-destructive",
  match: "bg-accent text-accent-foreground",
};

function Audit() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const summarize = useServerFn(summarizeAuditDiscrepancies);

  const flagged = auditItems.filter((i) => i.status !== "match");
  const cycle = auditItems[0]?.cycle ?? "current";

  async function onAiSummary() {
    setLoading(true);
    setSummary(null);
    try {
      const res = await summarize({
        data: {
          cycle,
          items: flagged.map((i) => ({
            assetTag: i.assetTag,
            expectedLocation: i.expectedLocation,
            foundLocation: i.foundLocation,
            status: i.status,
            department: i.department,
            note: i.note,
          })),
        },
      });
      setSummary(res.summary);
    } catch (e) {
      toast.error("Could not generate summary", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Audit"
        subtitle={`Cycle ${cycle} · ${flagged.length} discrepancies flagged`}
      />
      <div className="p-6 space-y-4">
        <SectionCard
          title="Discrepancy report"
          description="Items flagged during the current audit cycle"
          action={
            <Button size="sm" onClick={onAiSummary} disabled={loading || flagged.length === 0}>
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              AI Summary
            </Button>
          }
        >
          {(loading || summary) && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-accent/60 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> AI summary
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 w-4/5 animate-pulse rounded bg-primary/15" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-primary/15" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-primary/15" />
                </div>
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{summary}</p>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Asset</th>
                  <th className="px-3 py-2 text-left font-medium">Department</th>
                  <th className="px-3 py-2 text-left font-medium">Expected</th>
                  <th className="px-3 py-2 text-left font-medium">Found</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flagged.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2 font-medium">{i.assetTag}</td>
                    <td className="px-3 py-2 text-muted-foreground">{i.department}</td>
                    <td className="px-3 py-2 text-muted-foreground">{i.expectedLocation}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {i.foundLocation ?? <span className="italic">not found</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          statusPill[i.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i.status === "missing" || i.status === "damaged" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : null}
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
