"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { fetchJson, formatDate, labelize, unwrapList } from "@/lib/api-client";

type Department = { id: string; name: string };
type AuditItem = { id: string; result?: string; notes?: string; asset?: { name?: string; assetTag?: string } };
type Cycle = { id: string; title: string; location?: string | null; status?: string; startDate?: string; endDate?: string; department?: Department; items?: AuditItem[] };

export default function AuditsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", departmentId: "", location: "", startDate: "", endDate: "" });

  async function load() {
    const [deptPayload, cyclePayload] = await Promise.all([
      fetchJson("/api/departments").catch(() => []),
      fetchJson("/api/audits").catch(() => []),
    ]);
    setDepartments(unwrapList<Department>(deptPayload, ["departments"]));
    const nextCycles = unwrapList<Cycle>(cyclePayload, ["audits", "cycles"]);
    setCycles(nextCycles);
    setSelectedId((current) => current || nextCycles[0]?.id || "");
  }

  useEffect(() => { load(); }, []);

  async function createCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchJson("/api/audits", { method: "POST", json: { ...form, departmentId: form.departmentId || undefined } });
    setForm({ title: "", departmentId: "", location: "", startDate: "", endDate: "" });
    setMessage("Audit cycle created.");
    await load();
  }

  async function mark(itemId: string, result: string) {
    await fetchJson(`/api/audits/items/${itemId}`, { method: "PATCH", json: { result } });
    setMessage(`Item marked ${labelize(result)}.`);
    await load();
  }

  async function closeCycle(id: string) {
    await fetchJson(`/api/audits/${id}/close`, { method: "POST" });
    setMessage("Audit cycle closed.");
    await load();
  }

  const selected = cycles.find((cycle) => cycle.id === selectedId);

  return (
    <>
      <PageHeader eyebrow="Physical verification" title="Audits" description="Create audit cycles, verify assets as present, missing, or damaged, and close cycles with evidence." />
      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-xl font-semibold">Create cycle</h2>
            <form onSubmit={createCycle} className="mt-4 space-y-4">
              <Input placeholder="Quarterly IT asset audit" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              <Select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
                <option value="">All departments</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </Select>
              <Input placeholder="Location scope" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              <div className="grid gap-4 sm:grid-cols-2"><Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /><Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} required /></div>
              <Button type="submit">Create audit cycle</Button>
            </form>
          </Card>

          <Card>
            <h2 className="font-serif text-xl font-semibold">Cycles</h2>
            <div className="mt-4 space-y-2">
              {cycles.map((cycle) => (
                <button key={cycle.id} onClick={() => setSelectedId(cycle.id)} className={`w-full rounded-2xl border p-4 text-left ${selectedId === cycle.id ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-center justify-between gap-3"><p className="font-semibold">{cycle.title}</p><Badge tone={cycle.status === "CLOSED" ? "muted" : "info"}>{labelize(cycle.status)}</Badge></div>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(cycle.startDate)} to {formatDate(cycle.endDate)}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="font-serif text-xl font-semibold">{selected?.title || "Audit items"}</h2>
              <p className="text-sm text-slate-500">{selected?.department?.name || "All departments"} · {selected?.location || "All locations"}</p>
            </div>
            {selected && selected.status !== "CLOSED" ? <Button onClick={() => closeCycle(selected.id)}>Close cycle</Button> : null}
          </div>
          {selected?.items?.length ? (
            <div className="space-y-3">
              {selected.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div><p className="font-semibold">{item.asset?.name || "Asset"}</p><p className="text-sm text-slate-500">{item.asset?.assetTag || "No tag"}</p></div>
                    <Badge tone={item.result === "VERIFIED" ? "success" : item.result === "PENDING" ? "warning" : "danger"}>{labelize(item.result)}</Badge>
                  </div>
                  {selected.status !== "CLOSED" ? <div className="mt-3 flex flex-wrap gap-2">{["VERIFIED", "MISSING", "DAMAGED"].map((result) => <Button key={result} type="button" variant={result === "VERIFIED" ? "primary" : "secondary"} onClick={() => mark(item.id, result)}>{labelize(result)}</Button>)}</div> : null}
                </div>
              ))}
            </div>
          ) : <EmptyState title="No audit items" description="Assets in the selected scope will appear once the API creates cycle items." />}
        </Card>
      </div>
    </>
  );
}
