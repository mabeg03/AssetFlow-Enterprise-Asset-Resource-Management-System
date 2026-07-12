"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Select, Textarea } from "@/components/ui";
import { fetchJson, formatDate, labelize, unwrapList } from "@/lib/api-client";

type Asset = { id: string; name: string; assetTag: string };
type User = { id: string; name: string; role?: string };
type Request = { id: string; description: string; priority?: string; status?: string; createdAt?: string; asset?: Asset; requester?: User; technician?: User };

export default function MaintenancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ assetId: "", priority: "MEDIUM", description: "", photoUrl: "" });

  async function load() {
    const [assetPayload, userPayload, requestPayload] = await Promise.all([
      fetchJson("/api/assets").catch(() => []),
      fetchJson("/api/employees").catch(() => []),
      fetchJson("/api/maintenance").catch(() => []),
    ]);
    setAssets(unwrapList<Asset>(assetPayload, ["assets"]));
    setPeople(unwrapList<User>(userPayload, ["employees", "users"]));
    setRequests(unwrapList<Request>(requestPayload, ["maintenance", "requests"]));
  }

  useEffect(() => { load(); }, []);

  async function raise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchJson("/api/maintenance", { method: "POST", json: form });
    setForm({ assetId: "", priority: "MEDIUM", description: "", photoUrl: "" });
    setMessage("Maintenance request raised.");
    await load();
  }

  async function workflow(id: string, action: string, body: Record<string, unknown> = {}) {
    await fetchJson(`/api/maintenance/${id}/${action}`, { method: "POST", json: body });
    setMessage(`Maintenance ${action.replace("-", " ")} recorded.`);
    await load();
  }

  return (
    <>
      <PageHeader eyebrow="Reliability desk" title="Maintenance" description="Raise repair requests and progress them through approval, technician assignment, work, and resolution." />
      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="font-serif text-xl font-semibold">Raise request</h2>
          <form onSubmit={raise} className="mt-4 space-y-4">
            <Select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Select asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.assetTag})</option>)}
            </Select>
            <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((priority) => <option key={priority} value={priority}>{labelize(priority)}</option>)}
            </Select>
            <Textarea placeholder="Describe damage, issue, or service need" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            <Button type="submit">Raise maintenance</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold">Workflow queue</h2>
          <div className="mt-4 space-y-3">
            {requests.length ? requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="font-semibold text-slate-950">{request.asset?.name || "Asset"}</p>
                    <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                    <p className="mt-1 text-xs text-slate-500">Raised {formatDate(request.createdAt)} · Technician: {request.technician?.name || "Unassigned"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2"><Badge tone={request.priority === "CRITICAL" ? "danger" : request.priority === "HIGH" ? "warning" : "info"}>{labelize(request.priority)}</Badge><Badge tone="muted">{labelize(request.status)}</Badge></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.status === "PENDING" ? <><Button onClick={() => workflow(request.id, "approve")}>Approve</Button><Button variant="danger" onClick={() => workflow(request.id, "reject", { rejectionReason: "Rejected by reviewer" })}>Reject</Button></> : null}
                  {request.status === "APPROVED" ? <Select onChange={(event) => event.target.value && workflow(request.id, "assign", { technicianId: event.target.value })} defaultValue=""><option value="">Assign technician</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select> : null}
                  {request.status === "TECHNICIAN_ASSIGNED" ? <Button onClick={() => workflow(request.id, "start")}>Start work</Button> : null}
                  {request.status === "IN_PROGRESS" ? <Button onClick={() => workflow(request.id, "resolve", { resolutionNotes: "Resolved and ready for service" })}>Resolve</Button> : null}
                </div>
              </div>
            )) : <EmptyState title="No maintenance requests" description="Raised repair requests will appear here." />}
          </div>
        </Card>
      </div>
    </>
  );
}
