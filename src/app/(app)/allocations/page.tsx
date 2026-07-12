"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { fetchJson, formatDate, labelize, unwrapList } from "@/lib/api-client";

type Asset = { id: string; name: string; assetTag: string; status?: string; holder?: User };
type User = { id: string; name: string; email?: string };
type Department = { id: string; name: string };
type Allocation = { id: string; expectedReturnDate?: string; isOverdue?: boolean; asset?: Asset; holder?: User; department?: Department };
type Transfer = { id: string; status?: string; reason?: string; asset?: Asset; requester?: User; toUser?: User; toDepartment?: Department };

export default function AllocationsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ assetId: "", holderId: "", departmentId: "", expectedReturnDate: "" });
  const [transferForm, setTransferForm] = useState({ assetId: "", toUserId: "", toDepartmentId: "", reason: "" });
  const selectedAsset = assets.find((asset) => asset.id === form.assetId);

  async function load() {
    const [assetPayload, employeePayload, departmentPayload, allocationPayload, transferPayload] = await Promise.all([
      fetchJson("/api/assets").catch(() => []),
      fetchJson("/api/employees").catch(() => []),
      fetchJson("/api/departments").catch(() => []),
      fetchJson("/api/allocations").catch(() => []),
      fetchJson("/api/transfers").catch(() => []),
    ]);
    setAssets(unwrapList<Asset>(assetPayload, ["assets"]));
    setEmployees(unwrapList<User>(employeePayload, ["employees", "users"]));
    setDepartments(unwrapList<Department>(departmentPayload, ["departments"]));
    setAllocations(unwrapList<Allocation>(allocationPayload, ["allocations"]));
    setTransfers(unwrapList<Transfer>(transferPayload, ["transfers", "requests"]));
  }

  useEffect(() => { load(); }, []);

  async function allocate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await fetchJson("/api/allocations", { method: "POST", json: { ...form, departmentId: form.departmentId || undefined, expectedReturnDate: form.expectedReturnDate || undefined } });
    setForm({ assetId: "", holderId: "", departmentId: "", expectedReturnDate: "" });
    setMessage("Allocation created.");
    await load();
  }

  async function requestTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    await fetchJson("/api/transfers", { method: "POST", json: { ...transferForm, toUserId: transferForm.toUserId || undefined, toDepartmentId: transferForm.toDepartmentId || undefined } });
    setTransferForm({ assetId: "", toUserId: "", toDepartmentId: "", reason: "" });
    setMessage("Transfer request submitted.");
    await load();
  }

  async function action(url: string, ok: string) {
    setMessage("");
    await fetchJson(url, { method: "POST" });
    setMessage(ok);
    await load();
  }

  return (
    <>
      <PageHeader eyebrow="Custody workflows" title="Allocations" description="Assign assets, surface holder conflicts, process returns, and approve transfer requests." />
      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl font-semibold">Allocate asset</h2>
          <form onSubmit={allocate} className="mt-4 space-y-4">
            <Select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Select asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.assetTag}) - {labelize(asset.status)}</option>)}
            </Select>
            {selectedAsset && selectedAsset.status !== "AVAILABLE" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Allocation conflict detected</p>
                <p className="mt-1">This asset is {labelize(selectedAsset.status)}. Current holder: {selectedAsset.holder?.name || "lookup from allocation list"}.</p>
                <Button type="button" variant="secondary" className="mt-3" onClick={() => setTransferForm({ ...transferForm, assetId: selectedAsset.id })}>Prepare transfer request</Button>
              </div>
            ) : null}
            <Select value={form.holderId} onChange={(event) => setForm({ ...form, holderId: event.target.value })} required>
              <option value="">Select employee holder</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </Select>
            <Select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
              <option value="">Individual custody</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
            <Input type="date" value={form.expectedReturnDate} onChange={(event) => setForm({ ...form, expectedReturnDate: event.target.value })} />
            <Button type="submit">Allocate asset</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold">Transfer request</h2>
          <form onSubmit={requestTransfer} className="mt-4 space-y-4">
            <Select value={transferForm.assetId} onChange={(event) => setTransferForm({ ...transferForm, assetId: event.target.value })} required>
              <option value="">Select asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.assetTag})</option>)}
            </Select>
            <Select value={transferForm.toUserId} onChange={(event) => setTransferForm({ ...transferForm, toUserId: event.target.value })}>
              <option value="">Target employee</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </Select>
            <Select value={transferForm.toDepartmentId} onChange={(event) => setTransferForm({ ...transferForm, toDepartmentId: event.target.value })}>
              <option value="">Target department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
            <Textarea placeholder="Business reason for transfer" value={transferForm.reason} onChange={(event) => setTransferForm({ ...transferForm, reason: event.target.value })} />
            <Button type="submit">Submit transfer request</Button>
          </form>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl font-semibold">Active allocations</h2>
          <div className="mt-4 space-y-3">
            {allocations.length ? allocations.map((allocation) => (
              <div key={allocation.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex justify-between gap-3">
                  <div><p className="font-semibold">{allocation.asset?.name || "Asset"}</p><p className="text-sm text-slate-500">{allocation.holder?.name || allocation.department?.name || "No holder"} · Due {formatDate(allocation.expectedReturnDate)}</p></div>
                  <Badge tone={allocation.isOverdue ? "warning" : "info"}>{allocation.isOverdue ? "Overdue" : "Active"}</Badge>
                </div>
                <Button type="button" variant="secondary" className="mt-3" onClick={() => action(`/api/allocations/${allocation.id}/return`, "Asset returned.")}>Return asset</Button>
              </div>
            )) : <EmptyState title="No active allocations" description="Allocated assets will appear here." />}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold">Transfer approvals</h2>
          <div className="mt-4 space-y-3">
            {transfers.length ? transfers.map((transfer) => (
              <div key={transfer.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex justify-between gap-3">
                  <div><p className="font-semibold">{transfer.asset?.name || "Asset transfer"}</p><p className="text-sm text-slate-500">{transfer.reason || "No reason supplied"}</p></div>
                  <Badge tone={transfer.status === "REQUESTED" ? "warning" : "success"}>{labelize(transfer.status)}</Badge>
                </div>
                {transfer.status === "REQUESTED" ? <div className="mt-3 flex gap-2"><Button type="button" onClick={() => action(`/api/transfers/${transfer.id}/approve`, "Transfer approved.")}>Approve</Button><Button type="button" variant="danger" onClick={() => action(`/api/transfers/${transfer.id}/reject`, "Transfer rejected.")}>Reject</Button></div> : null}
              </div>
            )) : <EmptyState title="No transfer requests" description="Holder conflict requests will appear here." />}
          </div>
        </Card>
      </div>
    </>
  );
}
