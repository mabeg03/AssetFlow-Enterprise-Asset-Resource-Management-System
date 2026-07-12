"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { fetchJson, labelize, unwrapList } from "@/lib/api-client";

type Summary = { label: string; value: number };
type Row = { id?: string; label?: string; name?: string; count?: number; value?: number; status?: string };
type Reports = {
  assetStatus?: Row[];
  categoryValue?: Row[];
  maintenanceByPriority?: Row[];
  utilization?: Row[];
  summaries?: Summary[];
};

const colors = ["#0f6b68", "#294b59", "#c7954a", "#2f855a", "#b42318", "#64748b"];

export default function ReportsPage() {
  const [reports, setReports] = useState<Reports>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<Reports>("/api/reports")
      .then(setReports)
      .catch((err) => setError(err instanceof Error ? err.message : "Reports unavailable"));
  }, []);

  const assetStatus = useMemo(() => normalize(reports.assetStatus), [reports.assetStatus]);
  const categoryValue = useMemo(() => normalize(reports.categoryValue), [reports.categoryValue]);
  const maintenance = useMemo(() => normalize(reports.maintenanceByPriority), [reports.maintenanceByPriority]);
  const utilization = useMemo(() => normalize(reports.utilization), [reports.utilization]);

  return (
    <>
      <PageHeader eyebrow="Management reporting" title="Reports" description="Track inventory distribution, maintenance risk, booking utilization, and asset value concentration." />
      {error ? <Card className="mb-5 border-amber-200 bg-amber-50 text-sm text-amber-800">{error}</Card> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(reports.summaries || []).map((summary) => (
          <Card key={summary.label}>
            <p className="text-sm text-slate-500">{summary.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Assets by status">
          {assetStatus.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie dataKey="value" data={assetStatus} nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={3}>
                  {assetStatus.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No asset status data" />}
        </ChartCard>

        <ChartCard title="Category value">
          <BarGraph data={categoryValue} />
        </ChartCard>

        <ChartCard title="Maintenance by priority">
          <BarGraph data={maintenance} />
        </ChartCard>

        <Card>
          <h2 className="font-serif text-xl font-semibold">Shared resource utilization</h2>
          <div className="mt-4 overflow-x-auto">
            {utilization.length ? (
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-3">Resource</th><th>Bookings</th><th>Utilization</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {utilization.map((row) => (
                    <tr key={row.name}>
                      <td className="py-3 font-semibold text-slate-900">{row.name}</td>
                      <td>{row.count || row.value}</td>
                      <td><Badge tone="info">{Math.round(row.value || 0)}%</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState title="No utilization data" description="Bookings will populate utilization reports." />}
          </div>
        </Card>
      </div>
    </>
  );
}

function normalize(rows: Row[] = []) {
  return rows.map((row) => ({
    name: labelize(row.label || row.name || row.status),
    value: Number(row.value ?? row.count ?? 0),
    count: Number(row.count ?? row.value ?? 0),
  }));
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function BarGraph({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data.length) return <EmptyState title="No chart data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#0f6b68" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
