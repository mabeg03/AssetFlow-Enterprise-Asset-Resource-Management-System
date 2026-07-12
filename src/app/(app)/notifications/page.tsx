"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { fetchJson, formatDateTime, labelize, unwrapList } from "@/lib/api-client";

type Notification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  link?: string | null;
  createdAt?: string;
};

type Activity = {
  id: string;
  action: string;
  entityType: string;
  details?: string | null;
  createdAt?: string;
  actor?: { name?: string };
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [notificationPayload, activityPayload] = await Promise.all([
      fetchJson("/api/notifications").catch(() => []),
      fetchJson("/api/activity").catch(() => []),
    ]);
    setNotifications(unwrapList<Notification>(notificationPayload, ["notifications"]));
    setActivity(unwrapList<Activity>(activityPayload, ["activity", "logs"]));
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetchJson(`/api/notifications/${id}/read`, { method: "POST" });
    setMessage("Notification marked read.");
    await load();
  }

  async function markAllRead() {
    await fetchJson("/api/notifications/read-all", { method: "POST" });
    setMessage("All notifications marked read.");
    await load();
  }

  const unread = notifications.filter((notification) => !notification.isRead).length;

  return (
    <>
      <PageHeader
        eyebrow="Work queue"
        title="Notifications"
        description="Review assigned actions, approvals, audit events, and the latest operational activity."
        actions={<Button variant="secondary" onClick={markAllRead}>Mark all read</Button>}
      />
      {message ? <Card className="mb-5 border-teal-200 bg-teal-50 text-sm text-teal-800">{message}</Card> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">Notifications</h2>
            <Badge tone={unread ? "warning" : "success"}>{unread} unread</Badge>
          </div>
          <div className="space-y-3">
            {notifications.length ? notifications.map((notification) => (
              <div key={notification.id} className={`rounded-2xl border p-4 ${notification.isRead ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{labelize(notification.type)} · {formatDateTime(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead ? <Button type="button" variant="secondary" onClick={() => markRead(notification.id)}>Read</Button> : null}
                </div>
                {notification.link ? <Link href={notification.link} className="mt-3 inline-block text-sm font-semibold text-teal-700">Open related record</Link> : null}
              </div>
            )) : <EmptyState title="No notifications" description="Approvals and assignment alerts will appear here." />}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-xl font-semibold">Activity log</h2>
          <div className="mt-4 space-y-3">
            {activity.length ? activity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{labelize(item.action)} · {item.entityType}</p>
                  <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.details || `Performed by ${item.actor?.name || "system"}`}</p>
              </div>
            )) : <EmptyState title="No activity yet" description="System changes will be logged as users work." />}
          </div>
        </Card>
      </div>
    </>
  );
}
