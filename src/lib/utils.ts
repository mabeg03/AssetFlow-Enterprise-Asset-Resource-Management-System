import { AssetStatus, Role } from "@/lib/types";
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Under Maintenance",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  ALLOCATED: "bg-sky-100 text-sky-800",
  RESERVED: "bg-violet-100 text-violet-800",
  UNDER_MAINTENANCE: "bg-amber-100 text-amber-800",
  LOST: "bg-rose-100 text-rose-800",
  RETIRED: "bg-slate-100 text-slate-700",
  DISPOSED: "bg-stone-200 text-stone-700",
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  UPCOMING: "bg-sky-100 text-sky-800",
  ONGOING: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-stone-100 text-stone-600",
  OPEN: "bg-sky-100 text-sky-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  CLOSED: "bg-slate-100 text-slate-700",
  REQUESTED: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-rose-100 text-rose-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-slate-100 text-slate-700",
};

export function canManageOrg(role: Role) {
  return role === "ADMIN";
}

export function canManageAssets(role: Role) {
  return role === "ADMIN" || role === "ASSET_MANAGER";
}

export function canApproveTransfers(role: Role) {
  return role === "ADMIN" || role === "ASSET_MANAGER" || role === "DEPARTMENT_HEAD";
}

export function canApproveMaintenance(role: Role) {
  return role === "ADMIN" || role === "ASSET_MANAGER";
}
