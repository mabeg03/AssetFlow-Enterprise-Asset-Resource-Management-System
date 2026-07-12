import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { assets, maintenanceRequests } from "@/lib/mock-data";
import { suggestMaintenancePriority } from "@/lib/ai.functions";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — AssetFlow" },
      { name: "description", content: "Raise and track maintenance requests." },
    ],
  }),
  component: Maintenance,
});

type Priority = "low" | "medium" | "high" | "urgent";

const priorityCls: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-[oklch(0.78_0.15_75)]/20 text-[oklch(0.45_0.12_75)]",
  urgent: "bg-destructive/15 text-destructive",
};

function Maintenance() {
  const [assetTag, setAssetTag] = useState(assets[0].tag);
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [suggestion, setSuggestion] = useState<{ priority: Priority; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const suggest = useServerFn(suggestMaintenancePriority);
  const asset = assets.find((a) => a.tag === assetTag);

  async function onSuggest() {
    if (issue.trim().length < 5) {
      toast.error("Describe the issue first", { description: "Enter at least a short sentence." });
      return;
    }
    setAiLoading(true);
    setSuggestion(null);
    try {
      const res = await suggest({
        data: {
          issue,
          assetName: asset?.name,
          assetCategory: asset?.category,
          history: asset?.lastMaintenance ? [`Last serviced ${asset.lastMaintenance}`] : [],
        },
      });
      setSuggestion(res);
    } catch (e) {
      toast.error("Suggestion failed", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  }

  function acceptSuggestion() {
    if (suggestion) setPriority(suggestion.priority);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue.trim()) return;
    toast.success("Maintenance request submitted", {
      description: `${asset?.name} · priority ${priority.toUpperCase()}`,
    });
    setIssue("");
    setSuggestion(null);
    setPriority("medium");
  }

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Raise a request or review open items" />

      <div className="p-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <SectionCard title="New maintenance request" description="AI can suggest a priority based on your description">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="asset" className="text-xs">Asset</Label>
              <select
                id="asset"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {assets.map((a) => (
                  <option key={a.tag} value={a.tag}>
                    {a.tag} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="issue" className="text-xs">Describe the issue</Label>
              <Textarea
                id="issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g. Laptop overheats within 10 minutes of use and fan is constantly loud."
                rows={5}
                className="mt-1 resize-none"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {issue.length} characters
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSuggest}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  AI Suggest Priority
                </Button>
              </div>
            </div>

            {(aiLoading || suggestion) && (
              <div className="rounded-xl border border-primary/20 bg-accent/60 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Suggestion
                </div>
                {aiLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-primary/15" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-primary/15" />
                  </div>
                ) : suggestion ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                            priorityCls[suggestion.priority],
                          )}
                        >
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-sm leading-snug">{suggestion.reason}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={acceptSuggestion} type="button">
                        <Check className="mr-1 h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)} type="button">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div>
              <Label className="text-xs">Priority</Label>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {(["low", "medium", "high", "urgent"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                      priority === p
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-muted",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">Submit request</Button>
          </form>
        </SectionCard>

        <SectionCard title="Open & recent requests" description="Latest activity across teams">
          <ul className="divide-y divide-border">
            {maintenanceRequests.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{m.assetName}</span>
                    <span className="text-xs text-muted-foreground">· {m.assetTag}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.issue}</p>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {m.raisedBy} · {format(parseISO(m.raisedOn), "MMM d")}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase", priorityCls[m.priority])}>
                    {m.priority}
                  </span>
                  <span className="text-[11px] capitalize text-muted-foreground">{m.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
