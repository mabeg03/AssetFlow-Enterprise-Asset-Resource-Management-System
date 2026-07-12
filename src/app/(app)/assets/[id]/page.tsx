"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { fetchJson, formatDate, formatDateTime, labelize, unwrapList } from "@/lib/api-client";

type Asset = {
  id: string;
  name: string;
  assetTag: string;
  serialNumber?: string | null;
  category?: { name?: string };
  condition?: string;
  location?: string | null;
  status?: string;
  isShared?: boolean;
  acquisitionDate?: string | null;
  acquisitionCost?: number | null;
  notes?: string | null;
  allocations?: unknown[];
  bookings?: unknown[];
  maintenance?: unknown[];
  transfers?: unknown[];
  auditItems?: unknown[];
};

type Activity = {
  id: string;
  action: string;
  details?: string | null;
  createdAt?: string;
  actor?: { name?: string };
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<Activity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchJson<Asset | { asset: Asset }>(`/api/assets/${id}`),
      fetchJson(`/api/activity?entityType=Asset&entityId=${id}`).catch(() => []),
    ])
      .then(([assetPayload, activityPayload]) => {
        setAsset("asset" in assetPayload ? assetPayload.asset : assetPayload);
        setHistory(unwrapList<Activity>(activityPayload, ["activity", "logs"]));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Asset unavailable"));
  }, [id]);

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700">
        {error}
      </Card>
    );
  }

  if (!asset) {
    return <Card>Loading asset details...</Card>;
  }

  const facts = [
    ["Asset tag", asset.assetTag],
    ["Serial number", asset.serialNumber || "Not recorded"],
    ["Category", asset.category?.name || "Uncategorized"],
    ["Condition", labelize(asset.condition)],
    ["Location", asset.location || "Not set"],
    ["Acquired", formatDate(asset.acquisitionDate)],
    ["Cost", asset.acquisitionCost ? asset.acquisitionCost.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "Not recorded"],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Asset dossier"
        title={asset.name}
        description="View custody history, maintenance context, booking eligibility, and audit evidence for this asset."
        actions={
          <Link href="/assets">
            <Button variant="secondary" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to assets</Button>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone={asset.status === "AVAILABLE" ? "success" : "info"}>{labelize(asset.status)}</Badge>
            {asset.isShared ? <Badge>Shared bookable</Badge> : null}
          </div>
          <div className="grid gap-3">
            {facts.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
          {asset.notes ? <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{asset.notes}</p> : null}
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold text-slate-950">History</h2>
          <div className="mt-4 space-y-3">
            {history.length ? history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{labelize(item.action)}</p>
                  <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.details || `Updated by ${item.actor?.name || "system"}`}</p>
              </div>
            )) : <EmptyState title="No history yet" description="Custody, transfer, maintenance, and audit events will appear here." />}
          </div>
        </Card>
      </div>
    </>
  );
}
