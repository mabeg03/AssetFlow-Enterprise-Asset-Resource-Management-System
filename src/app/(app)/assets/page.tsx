"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { fetchJson, formatDate, labelize, unwrapList } from "@/lib/api-client";

type Category = { id: string; name: string };
type Asset = {
  id: string;
  name: string;
  assetTag: string;
  serialNumber?: string | null;
  categoryId?: string;
  category?: Category;
  acquisitionDate?: string | null;
  acquisitionCost?: number | null;
  condition?: string;
  location?: string | null;
  status?: string;
  isShared?: boolean;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    assetTag: "",
    serialNumber: "",
    categoryId: "",
    acquisitionDate: "",
    acquisitionCost: "",
    condition: "GOOD",
    location: "",
    isShared: false,
    notes: "",
  });

  async function load() {
    const [assetPayload, categoryPayload] = await Promise.all([
      fetchJson("/api/assets").catch(() => []),
      fetchJson("/api/categories").catch(() => []),
    ]);
    setAssets(unwrapList<Asset>(assetPayload, ["assets"]));
    setCategories(unwrapList<Category>(categoryPayload, ["categories"]));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return assets.filter((asset) =>
      [asset.name, asset.assetTag, asset.serialNumber, asset.location, asset.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [assets, query]);

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await fetchJson("/api/assets", {
      method: "POST",
      json: {
        ...form,
        acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
        acquisitionDate: form.acquisitionDate || undefined,
      },
    });
    setForm({ name: "", assetTag: "", serialNumber: "", categoryId: "", acquisitionDate: "", acquisitionCost: "", condition: "GOOD", location: "", isShared: false, notes: "" });
    setMessage("Asset registered.");
    await load();
  }

  return (
    <>
      <PageHeader
        eyebrow="Asset registry"
        title="Assets"
        description="Register physical assets and search the operational directory by tag, serial, category, status, or location."
      />

      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="font-serif text-xl font-semibold text-slate-950">Register asset</h2>
          <form onSubmit={createAsset} className="mt-4 grid gap-4">
            <Input placeholder="Asset name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <Input placeholder="Asset tag, e.g. AF-00042" value={form.assetTag} onChange={(event) => setForm({ ...form, assetTag: event.target.value })} required />
            <Input placeholder="Serial number" value={form.serialNumber} onChange={(event) => setForm({ ...form, serialNumber: event.target.value })} />
            <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="date" value={form.acquisitionDate} onChange={(event) => setForm({ ...form, acquisitionDate: event.target.value })} />
              <Input type="number" placeholder="Acquisition cost" value={form.acquisitionCost} onChange={(event) => setForm({ ...form, acquisitionCost: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>
                {["EXCELLENT", "GOOD", "FAIR", "POOR"].map((condition) => <option key={condition} value={condition}>{labelize(condition)}</option>)}
              </Select>
              <Input placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.isShared} onChange={(event) => setForm({ ...form, isShared: event.target.checked })} />
              Shared bookable resource
            </label>
            <Textarea placeholder="Notes, warranty, custody policy" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <Button type="submit">Register asset</Button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <h2 className="font-serif text-xl font-semibold text-slate-950">Asset directory</h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search assets" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>
          {filtered.length ? (
            <div className="grid gap-3">
              {filtered.map((asset) => (
                <Link key={asset.id} href={`/assets/${asset.id}`} className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-200 hover:bg-teal-50/50">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{asset.name}</p>
                      <p className="text-sm text-slate-500">{asset.assetTag} · {asset.category?.name || "Uncategorized"} · {asset.location || "No location"}</p>
                      <p className="mt-1 text-xs text-slate-400">Acquired {formatDate(asset.acquisitionDate)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={asset.status === "AVAILABLE" ? "success" : asset.status === "UNDER_MAINTENANCE" ? "warning" : "info"}>{labelize(asset.status)}</Badge>
                      {asset.isShared ? <Badge tone="default">Shared</Badge> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No assets found" description="Register an asset or adjust your search." />
          )}
        </Card>
      </div>
    </>
  );
}
