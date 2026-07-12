import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Download } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import {
  utilizationTrend,
  maintenanceByCategory,
  dueForMaintenance,
  departmentAllocation,
  bookingHeatmap,
} from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — AssetFlow" },
      { name: "description", content: "Utilization trends, maintenance and booking analytics." },
    ],
  }),
  component: Reports,
});

const AXIS_COLOR = "oklch(0.52 0.02 250)";
const GRID_COLOR = "oklch(0.92 0.005 250)";

function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [
    cols.join(","),
    ...rows.map((r) =>
      cols
        .map((c) => {
          const v = r[c];
          const s = v == null ? "" : String(v);
          return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportBtn({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return (
    <Button size="sm" variant="ghost" onClick={() => exportCsv(name, rows)}>
      <Download className="mr-1.5 h-3.5 w-3.5" /> Export
    </Button>
  );
}

function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Utilization, maintenance and booking trends"
      />
      <div className="p-6 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Asset utilization trends"
          description="Most-used vs idle assets by month"
          action={<ExportBtn name="utilization" rows={utilizationTrend} />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilizationTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke={AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="used" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} name="Used %" />
                <Line type="monotone" dataKey="idle" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} name="Idle %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Maintenance frequency"
          description="Requests by asset category (last 12 months)"
          action={<ExportBtn name="maintenance-by-category" rows={maintenanceByCategory} />}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceByCategory} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" stroke={AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Due for maintenance / nearing retirement"
          description="Prioritized watchlist"
          action={<ExportBtn name="due-maintenance" rows={dueForMaintenance} />}
          className="lg:col-span-1"
        >
          <ul className="divide-y divide-border">
            {dueForMaintenance.map((d) => (
              <li
                key={d.tag}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {d.name} <span className="text-muted-foreground">· {d.tag}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{d.kind}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    d.dueIn < 0
                      ? "bg-destructive/15 text-destructive"
                      : d.dueIn <= 7
                        ? "bg-[oklch(0.78_0.15_75)]/20 text-[oklch(0.45_0.12_75)]"
                        : "bg-accent text-accent-foreground"
                  }`}
                >
                  {d.dueIn < 0 ? `${Math.abs(d.dueIn)}d overdue` : `in ${d.dueIn}d`}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Department-wise allocation"
          description="Assets by department and status"
          action={<ExportBtn name="department-allocation" rows={departmentAllocation} />}
        >
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Department</th>
                  <th className="px-3 py-2 text-right font-medium">Allocated</th>
                  <th className="px-3 py-2 text-right font-medium">Available</th>
                  <th className="px-3 py-2 text-right font-medium">In Maint.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departmentAllocation.map((d) => (
                  <tr key={d.department}>
                    <td className="px-3 py-2 font-medium">{d.department}</td>
                    <td className="px-3 py-2 text-right">{d.allocated}</td>
                    <td className="px-3 py-2 text-right">{d.available}</td>
                    <td className="px-3 py-2 text-right">{d.maintenance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Resource booking heatmap"
          description="Peak usage — weekdays × hours"
          className="lg:col-span-2"
          action={<ExportBtn name="booking-heatmap" rows={bookingHeatmap.flatMap((d) => d.cells.map((c) => ({ day: d.day, hour: c.hour, load: c.value.toFixed(2) })))} />}
        >
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-[3rem_repeat(11,minmax(2.25rem,1fr))] items-center gap-1 text-[11px] text-muted-foreground">
                <div />
                {bookingHeatmap[0].cells.map((c) => (
                  <div key={c.hour} className="text-center">
                    {c.hour}:00
                  </div>
                ))}
                {bookingHeatmap.map((row) => (
                  <RowFragment key={row.day} row={row} />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Low</span>
                <div className="flex overflow-hidden rounded">
                  {[0.15, 0.3, 0.5, 0.7, 0.9].map((v) => (
                    <div
                      key={v}
                      className="h-3 w-6"
                      style={{ backgroundColor: heatColor(v) }}
                    />
                  ))}
                </div>
                <span>High</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function RowFragment({
  row,
}: {
  row: { day: string; cells: { hour: number; value: number }[] };
}) {
  return (
    <>
      <div className="text-xs font-medium text-foreground">{row.day}</div>
      {row.cells.map((c) => (
        <div
          key={c.hour}
          className="h-8 rounded"
          style={{ backgroundColor: heatColor(c.value) }}
          title={`${row.day} ${c.hour}:00 · load ${(c.value * 100).toFixed(0)}%`}
        />
      ))}
    </>
  );
}

function heatColor(v: number) {
  const alpha = 0.08 + v * 0.72;
  return `color-mix(in oklab, var(--primary) ${alpha * 100}%, transparent)`;
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};
