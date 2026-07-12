// Placeholder in-memory data. Replaced by Supabase queries once schema is provided.
import type { Role } from "./role";

export type Asset = {
  id: string;
  tag: string;
  name: string;
  category: string;
  status: "available" | "allocated" | "maintenance" | "retired";
  department: string;
  assignedTo?: string;
  purchaseDate: string;
  lastMaintenance?: string;
};

export type Allocation = {
  id: string;
  assetTag: string;
  assetName: string;
  employee: string;
  department: string;
  allocatedOn: string;
  expectedReturn: string;
  returned: boolean;
};

export type Booking = {
  id: string;
  resource: string;
  bookedBy: string;
  start: string;
  end: string;
  status: "confirmed" | "pending" | "cancelled";
};

export type MaintenanceRequest = {
  id: string;
  assetTag: string;
  assetName: string;
  issue: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "approved" | "rejected" | "completed";
  raisedBy: string;
  raisedOn: string;
};

export type AuditItem = {
  id: string;
  cycle: string;
  assetTag: string;
  expectedLocation: string;
  foundLocation: string | null;
  status: "match" | "missing" | "misplaced" | "damaged";
  department: string;
  note?: string;
};

export type Notification = {
  id: string;
  kind:
    | "asset_assigned"
    | "maintenance_approved"
    | "maintenance_rejected"
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "transfer_approved"
    | "overdue_return"
    | "audit_discrepancy";
  title: string;
  detail: string;
  at: string;
  read: boolean;
  actor?: string;
};

export type ActivityLog = {
  id: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  at: string;
};

const now = new Date();
const iso = (offsetDays: number, h = 9) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

export const assets: Asset[] = [
  { id: "1", tag: "LT-2041", name: 'MacBook Pro 16"', category: "Laptop", status: "allocated", department: "Engineering", assignedTo: "Jordan Reyes", purchaseDate: "2023-04-11", lastMaintenance: "2025-11-02" },
  { id: "2", tag: "LT-2042", name: "ThinkPad X1", category: "Laptop", status: "available", department: "IT", purchaseDate: "2024-01-20" },
  { id: "3", tag: "MN-1108", name: 'Dell UltraSharp 27"', category: "Monitor", status: "allocated", department: "Design", assignedTo: "Priya Shah", purchaseDate: "2023-09-30" },
  { id: "4", tag: "PR-330", name: "HP LaserJet Pro", category: "Printer", status: "maintenance", department: "Operations", purchaseDate: "2022-06-15", lastMaintenance: "2026-06-30" },
  { id: "5", tag: "CR-014", name: "Meeting Room Camera", category: "AV", status: "available", department: "IT", purchaseDate: "2024-08-01" },
  { id: "6", tag: "LT-2058", name: 'MacBook Air 13"', category: "Laptop", status: "allocated", department: "Sales", assignedTo: "Sam Ortiz", purchaseDate: "2024-03-14" },
  { id: "7", tag: "PH-901", name: "iPhone 15", category: "Phone", status: "allocated", department: "Sales", assignedTo: "Rita Kim", purchaseDate: "2024-10-01" },
  { id: "8", tag: "LT-2075", name: 'MacBook Pro 14"', category: "Laptop", status: "retired", department: "Engineering", purchaseDate: "2020-05-01" },
];

export const allocations: Allocation[] = [
  { id: "a1", assetTag: "LT-2041", assetName: 'MacBook Pro 16"', employee: "Jordan Reyes", department: "Engineering", allocatedOn: iso(-40), expectedReturn: iso(-3), returned: false },
  { id: "a2", assetTag: "MN-1108", assetName: 'Dell UltraSharp 27"', employee: "Priya Shah", department: "Design", allocatedOn: iso(-90), expectedReturn: iso(-10), returned: false },
  { id: "a3", assetTag: "LT-2058", assetName: 'MacBook Air 13"', employee: "Sam Ortiz", department: "Sales", allocatedOn: iso(-14), expectedReturn: iso(2), returned: false },
  { id: "a4", assetTag: "PH-901", assetName: "iPhone 15", employee: "Rita Kim", department: "Sales", allocatedOn: iso(-30), expectedReturn: iso(5), returned: false },
  { id: "a5", assetTag: "CR-014", assetName: "Meeting Room Camera", employee: "Ana Diaz", department: "IT", allocatedOn: iso(-2), expectedReturn: iso(6), returned: false },
];

export const bookings: Booking[] = [
  { id: "b1", resource: "Conference Room A", bookedBy: "Alex Chen", start: iso(0, 10), end: iso(0, 11), status: "confirmed" },
  { id: "b2", resource: "Projector — HD-01", bookedBy: "Priya Shah", start: iso(1, 14), end: iso(1, 16), status: "confirmed" },
  { id: "b3", resource: "Conference Room B", bookedBy: "Jordan Reyes", start: iso(2, 9), end: iso(2, 10), status: "pending" },
  { id: "b4", resource: "Van #3", bookedBy: "Sam Ortiz", start: iso(3, 8), end: iso(3, 17), status: "confirmed" },
];

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: "m1", assetTag: "PR-330", assetName: "HP LaserJet Pro", issue: "Paper jam every ~20 pages, streaks on output.", priority: "medium", status: "open", raisedBy: "Ana Diaz", raisedOn: iso(-1) },
  { id: "m2", assetTag: "LT-2041", assetName: 'MacBook Pro 16"', issue: "Battery drains from 100% to 20% in under an hour.", priority: "high", status: "approved", raisedBy: "Jordan Reyes", raisedOn: iso(-3) },
  { id: "m3", assetTag: "MN-1108", assetName: 'Dell UltraSharp 27"', issue: "Dead pixel cluster upper-left corner.", priority: "low", status: "completed", raisedBy: "Priya Shah", raisedOn: iso(-9) },
];

export const auditItems: AuditItem[] = [
  { id: "au1", cycle: "Q4-2026", assetTag: "LT-2101", expectedLocation: "IT Storage", foundLocation: null, status: "missing", department: "IT" },
  { id: "au2", cycle: "Q4-2026", assetTag: "LT-2102", expectedLocation: "IT Storage", foundLocation: null, status: "missing", department: "IT" },
  { id: "au3", cycle: "Q4-2026", assetTag: "LT-2103", expectedLocation: "IT Storage", foundLocation: null, status: "missing", department: "IT" },
  { id: "au4", cycle: "Q4-2026", assetTag: "MN-1109", expectedLocation: "Design Floor 3", foundLocation: "Marketing Floor 2", status: "misplaced", department: "Design" },
  { id: "au5", cycle: "Q4-2026", assetTag: "CR-018", expectedLocation: "Conference Room B", foundLocation: "Conference Room B", status: "damaged", department: "Operations", note: "Cracked lens housing" },
  { id: "au6", cycle: "Q4-2026", assetTag: "PH-905", expectedLocation: "Sales Cabinet", foundLocation: null, status: "missing", department: "Sales" },
];

export const notifications: Notification[] = [
  { id: "n1", kind: "overdue_return", title: "Overdue return", detail: 'MacBook Pro 16" (LT-2041) — 3 days past expected return', at: iso(0, 8), read: false, actor: "System" },
  { id: "n2", kind: "audit_discrepancy", title: "Audit discrepancy flagged", detail: "3 laptops missing in IT department (Q4-2026)", at: iso(0, 7), read: false, actor: "System" },
  { id: "n3", kind: "maintenance_approved", title: "Maintenance approved", detail: "LT-2041 battery replacement approved", at: iso(-1, 15), read: false, actor: "Alex Chen" },
  { id: "n4", kind: "booking_confirmed", title: "Booking confirmed", detail: "Conference Room A · today 10:00–11:00", at: iso(-1, 9), read: true, actor: "System" },
  { id: "n5", kind: "asset_assigned", title: "Asset assigned", detail: "iPhone 15 (PH-901) assigned to Rita Kim", at: iso(-2, 11), read: true, actor: "Priya Shah" },
  { id: "n6", kind: "transfer_approved", title: "Transfer approved", detail: "MN-1108 moved from IT → Design", at: iso(-4, 13), read: true, actor: "Alex Chen" },
];

export const activityLogs: ActivityLog[] = [
  { id: "l1", actor: "Alex Chen", role: "admin", action: "Approved maintenance request", target: "LT-2041", at: iso(-1, 15) },
  { id: "l2", actor: "Priya Shah", role: "manager", action: "Assigned asset", target: "PH-901 → Rita Kim", at: iso(-2, 11) },
  { id: "l3", actor: "System", role: "admin", action: "Flagged audit discrepancy", target: "Q4-2026 · 3 missing", at: iso(0, 7) },
  { id: "l4", actor: "Jordan Reyes", role: "employee", action: "Raised maintenance request", target: "LT-2041", at: iso(-3, 10) },
  { id: "l5", actor: "Sam Ortiz", role: "employee", action: "Booked resource", target: "Van #3", at: iso(-1, 8) },
  { id: "l6", actor: "Alex Chen", role: "admin", action: "Approved transfer", target: "MN-1108", at: iso(-4, 13) },
];

// Chart data
export const utilizationTrend = [
  { month: "Jul", used: 62, idle: 38 },
  { month: "Aug", used: 68, idle: 32 },
  { month: "Sep", used: 71, idle: 29 },
  { month: "Oct", used: 74, idle: 26 },
  { month: "Nov", used: 78, idle: 22 },
  { month: "Dec", used: 82, idle: 18 },
];

export const maintenanceByCategory = [
  { category: "Laptop", count: 24 },
  { category: "Monitor", count: 9 },
  { category: "Printer", count: 15 },
  { category: "Phone", count: 6 },
  { category: "AV", count: 4 },
];

export const dueForMaintenance = [
  { tag: "PR-330", name: "HP LaserJet Pro", dueIn: -1, kind: "Overdue service" },
  { tag: "LT-2041", name: 'MacBook Pro 16"', dueIn: 6, kind: "Annual check" },
  { tag: "CR-014", name: "Meeting Room Camera", dueIn: 12, kind: "Firmware update" },
  { tag: "LT-2075", name: 'MacBook Pro 14"', dueIn: 30, kind: "Nearing retirement" },
];

export const departmentAllocation = [
  { department: "Engineering", allocated: 42, available: 8, maintenance: 3 },
  { department: "Design", allocated: 18, available: 4, maintenance: 1 },
  { department: "Sales", allocated: 27, available: 6, maintenance: 2 },
  { department: "Operations", allocated: 15, available: 5, maintenance: 4 },
  { department: "IT", allocated: 11, available: 22, maintenance: 2 },
];

// Booking heatmap: rows = days, cols = hours 8..18
export const bookingHeatmap = (() => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  return days.map((d, di) => ({
    day: d,
    cells: hours.map((h) => {
      const base = Math.sin((di + 1) * (h - 8) * 0.4) * 0.5 + 0.5;
      const peak = h >= 10 && h <= 15 ? 0.35 : 0;
      return { hour: h, value: Math.min(1, base * 0.7 + peak + (di % 2 === 0 ? 0.1 : 0)) };
    }),
  }));
})();
