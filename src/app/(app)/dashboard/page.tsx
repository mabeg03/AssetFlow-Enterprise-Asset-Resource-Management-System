"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck, ClipboardCheck, Package, Wrench } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { fetchJson, formatDate, labelize, unwrapList } from "@/lib/api-client";

type Dashboard = {
  totalAssets?: number;
  availableAssets?: number;
  activeAllocations?: number;
  openMaintenance?: number;
  overdueAllocations?: Array<{
    id: string;
    expectedReturnDate?: string;
    asset?: { name?: string; assetTag?: string };
    holder?: { name?: string };
  }>;
  pendingApprovals?: Array<{ id: string; title?: string; type?: string; createdAt?: string }>;
};

const cards = [
  { key: "totalAssets", label: "Tracked assets", icon: Package },
  { key: "availableAssets", label: "Ready to allocate", icon: ClipboardCheck },
  { key: "activeAllocations", label: "Active allocations", icon: CalendarCheck },
  { key: "openMaintenance", label: "Open maintenance", icon: Wrench },
] as const;

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<Dashboard>("/api/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Dashboard unavailable"));
  }, []);

  const overdue = data.overdueAllocations || [];
  const approvals = data.pendingApprovals || [];

  return (
    <>
      <PageHeader
        eyebrow="Operations command center"
        title="Dashboard"
        description="Monitor asset availability, overdue returns, pending approvals, and work that needs attention today."
        actions={
          <>
            <Link href="/assets">
              <Button>Register asset</Button>
            </Link>
            <Link href="/allocations">
              <Button variant="secondary">Allocate asset</Button>
            </Link>
          </>
        }
      />

      {error ? (
        <Card className="mb-6 border-amber-200 bg-amber-50 text-sm text-amber-800">{error}</Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-950">
                    {Number(data[card.key] || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-slate-950">Overdue returns</h2>
            <Badge tone={overdue.length ? "warning" : "success"}>{overdue.length} open</Badge>
          </div>
          {overdue.length ? (
            <div className="divide-y divide-slate-100">
              {overdue.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.asset?.name || "Asset"}{" "}
                      <span className="text-slate-400">{item.asset?.assetTag}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Holder: {item.holder?.name || "Unassigned"}
                    </p>
                  </div>
                  <Badge tone="warning">Due {formatDate(item.expectedReturnDate)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No overdue assets" description="Every active allocation is within return policy." />
          )}
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold text-slate-950">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            {[
              { href: "/bookings", label: "Book a shared resource", icon: CalendarCheck },
              { href: "/maintenance", label: "Raise maintenance request", icon: AlertTriangle },
              { href: "/audits", label: "Start audit cycle", icon: ClipboardCheck },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-slate-800 hover:border-teal-200 hover:bg-teal-50"
                >
                  <Icon className="h-5 w-5 text-teal-700" />
                  {action.label}
                </Link>
              );
            })}
          </div>

          <h3 className="mt-6 font-semibold text-slate-900">Pending approvals</h3>
          <div className="mt-3 space-y-3">
            {approvals.length ? (
              approvals.map((approval) => (
                <div key={approval.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{approval.title || "Approval request"}</p>
                  <p className="text-slate-500">{labelize(approval.type)} · {formatDate(approval.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No approval queue right now.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
