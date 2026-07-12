import { NextResponse } from "next/server";
import { Role } from "@/lib/types";
import { jsonError } from "@/lib/auth";

export const managerRoles: Role[] = ["ADMIN", "ASSET_MANAGER"];
export const transferApproverRoles: Role[] = [
  "ADMIN",
  "ASSET_MANAGER",
  "DEPARTMENT_HEAD",
];

export function handleRouteError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (error.message.startsWith("Missing ") || error.message.startsWith("Invalid ")) {
      return jsonError(error.message, 400);
    }
  }

  console.error(error);
  return jsonError("Something went wrong", 500);
}

export function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${field}`);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function optionalDate(value: unknown) {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date;
}

export function parseBoolean(value: string | null) {
  if (value === null) return undefined;
  return value === "true";
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function applyDefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
