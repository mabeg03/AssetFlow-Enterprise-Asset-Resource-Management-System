import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { assets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Assets — AssetFlow" },
      { name: "description", content: "Asset register." },
    ],
  }),
  component: Assets,
});

const statusPill: Record<string, string> = {
  available: "bg-accent text-accent-foreground",
  allocated: "bg-primary/10 text-primary",
  maintenance: "bg-[oklch(0.78_0.15_75)]/20 text-[oklch(0.45_0.12_75)]",
  retired: "bg-muted text-muted-foreground",
};

function Assets() {
  return (
    <div>
      <PageHeader title="Assets" subtitle={`${assets.length} in register`} />
      <div className="p-6">
        <SectionCard title="Register" description="All tracked assets">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Tag</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Category</th>
                  <th className="px-3 py-2 text-left font-medium">Department</th>
                  <th className="px-3 py-2 text-left font-medium">Assigned to</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 font-mono text-xs">{a.tag}</td>
                    <td className="px-3 py-2 font-medium">{a.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{a.category}</td>
                    <td className="px-3 py-2 text-muted-foreground">{a.department}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {a.assignedTo ?? <span className="italic">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          statusPill[a.status],
                        )}
                      >
                        {a.status}
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
