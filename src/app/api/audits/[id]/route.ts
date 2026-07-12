import { NextRequest } from "next/server";
import { AssetStatus, AuditCycleStatus, AuditItemResult, Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { jsonError, logActivity, requireSession } from "@/lib/auth";
import { handleRouteError, ok, optionalString } from "../../_helpers";

const closeRoles = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"];

type ItemResultInput = {
  itemId?: string;
  result?: AuditItemResult;
  notes?: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const audit = await prisma.auditCycle.findUnique({
      where: { id },
      include: {
        department: true,
        assignments: {
          include: { auditor: { select: { id: true, name: true, email: true } } },
        },
        items: {
          include: {
            asset: { include: { category: true } },
            checkedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { asset: { assetTag: "asc" } },
        },
      },
    });

    if (!audit) return jsonError("Audit not found", 404);
    return ok({ audit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const itemResults: ItemResultInput[] = Array.isArray(body.itemResults)
      ? body.itemResults
      : [];
    const closeCycle = Boolean(body.closeCycle || body.action === "close");

    if (closeCycle && !closeRoles.includes(session.role)) throw new Error("FORBIDDEN");

    const audit = await prisma.$transaction(async (tx) => {
      for (const item of itemResults) {
        if (!item.itemId || !item.result) continue;
        await tx.auditItem.update({
          where: { id: item.itemId },
          data: {
            result: item.result,
            notes:
              item.notes === null
                ? null
                : optionalString(item.notes),
            checkedById: session.id,
            checkedAt: new Date(),
          },
        });
      }

      if (!closeCycle) {
        return tx.auditCycle.findUniqueOrThrow({
          where: { id },
          include: {
            items: {
              include: {
                asset: true,
                checkedBy: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });
      }

      const items = await tx.auditItem.findMany({
        where: { auditCycleId: id },
        include: { asset: true },
      });
      const missingItems = items.filter((item) => item.result === "MISSING");
      const damagedItems = items.filter((item) => item.result === "DAMAGED");
      const report = {
        generatedAt: new Date().toISOString(),
        totals: {
          items: items.length,
          verified: items.filter((item) => item.result === "VERIFIED").length,
          missing: missingItems.length,
          damaged: damagedItems.length,
          pending: items.filter((item) => item.result === "PENDING").length,
        },
        discrepancies: {
          missing: missingItems.map((item) => ({
            assetId: item.assetId,
            assetTag: item.asset.assetTag,
            name: item.asset.name,
            notes: item.notes,
          })),
          damaged: damagedItems.map((item) => ({
            assetId: item.assetId,
            assetTag: item.asset.assetTag,
            name: item.asset.name,
            notes: item.notes,
          })),
        },
      };

      if (missingItems.length) {
        await tx.asset.updateMany({
          where: { id: { in: missingItems.map((item) => item.assetId) } },
          data: { status: "LOST" },
        });
      }

      return tx.auditCycle.update({
        where: { id },
        data: {
          status: "CLOSED",
          reportJson: JSON.stringify(report),
        },
        include: {
          items: {
            include: {
              asset: true,
              checkedBy: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    });

    await logActivity(session.id, closeCycle ? "CLOSE_AUDIT" : "UPDATE_AUDIT", "AuditCycle", id);
    return ok({ audit });
  } catch (error) {
    return handleRouteError(error);
  }
}
