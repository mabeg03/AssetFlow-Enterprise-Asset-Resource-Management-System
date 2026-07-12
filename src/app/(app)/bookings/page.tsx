"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { fetchJson, formatDateTime, labelize, unwrapList } from "@/lib/api-client";

type Asset = { id: string; name: string; assetTag: string; isShared?: boolean };
type Booking = { id: string; startTime?: string; endTime?: string; purpose?: string; status?: string; asset?: Asset; bookedBy?: { name?: string } };

export default function BookingsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ assetId: "", startTime: "", endTime: "", purpose: "" });

  async function load() {
    const [assetPayload, bookingPayload] = await Promise.all([
      fetchJson("/api/assets?shared=true").catch(() => []),
      fetchJson("/api/bookings").catch(() => []),
    ]);
    setAssets(unwrapList<Asset>(assetPayload, ["assets"]).filter((asset) => asset.isShared !== false));
    setBookings(unwrapList<Booking>(bookingPayload, ["bookings"]));
  }

  useEffect(() => { load(); }, []);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await fetchJson("/api/bookings", { method: "POST", json: form });
      setForm({ assetId: "", startTime: "", endTime: "", purpose: "" });
      setMessage("Booking confirmed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking overlaps with an existing reservation.");
    }
  }

  async function cancel(id: string) {
    await fetchJson(`/api/bookings/${id}/cancel`, { method: "POST" });
    setMessage("Booking cancelled.");
    await load();
  }

  return (
    <>
      <PageHeader eyebrow="Shared resources" title="Bookings" description="Reserve projectors, meeting equipment, vehicles, and other shared assets with overlap protection." />
      {error ? <Card className="mb-5 border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</Card> : null}
      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="font-serif text-xl font-semibold">Book shared resource</h2>
          <form onSubmit={book} className="mt-4 space-y-4">
            <Select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Select shared asset</option>
              {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.assetTag})</option>)}
            </Select>
            <Input type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required />
            <Input type="datetime-local" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required />
            <Textarea placeholder="Purpose, team, meeting reference" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} />
            <Button type="submit">Create booking</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold">Booking calendar</h2>
          <div className="mt-4 space-y-3">
            {bookings.length ? bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="font-semibold text-slate-950">{booking.asset?.name || "Shared asset"}</p>
                    <p className="text-sm text-slate-500">{formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.purpose || "No purpose supplied"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={booking.status === "CANCELLED" ? "muted" : "info"}>{labelize(booking.status)}</Badge>
                    {booking.status !== "CANCELLED" ? <Button type="button" variant="secondary" onClick={() => cancel(booking.id)}>Cancel</Button> : null}
                  </div>
                </div>
              </div>
            )) : <EmptyState title="No bookings" description="Book a shared resource to reserve time on the calendar." />}
          </div>
        </Card>
      </div>
    </>
  );
}
