import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles, requireSession } from "@/lib/auth";
import {
  handleRouteError,
  managerRoles,
  ok,
  optionalDate,
  optionalString,
  requiredString,
} from "../_helpers";

export async function GET() {
  try {
    await requireSession();
    const audits = await prisma.auditCycle.findMany({
      include: {
        department: true,
        assignments: {
          include: { auditor: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ audits });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles(managerRoles);
    const body = await request.json();
    const auditorIds = Array.isArray(body.auditorIds)
      ? body.auditorIds.filter((id: unknown) => typeof id === "string")
      : [];
    const departmentId = optionalString(body.departmentId);
    const location = optionalString(body.location);

    const scopedAssets = await prisma.asset.findMany({
      where: {
        location: location ? { contains: location } : undefined,
        ...(departmentId
          ? { allocations: { some: { departmentId, isActive: true } } }
          : {}),
      },
      select: { id: true },
    });

    const audit = await prisma.$transaction(async (tx) => {
      const cycle = await tx.auditCycle.create({
        data: {
          title: requiredString(body.title, "title"),
          departmentId,
          location,
          startDate: optionalDate(body.startDate) || new Date(),
          endDate: optionalDate(body.endDate) || new Date(),
        },
      });

      if (auditorIds.length) {
        await tx.auditAssignment.createMany({
          data: auditorIds.map((auditorId: string) => ({
            auditCycleId: cycle.id,
            auditorId,
          })),
        });
      }

      if (scopedAssets.length) {
        await tx.auditItem.createMany({
          data: scopedAssets.map((asset) => ({
            auditCycleId: cycle.id,
            assetId: asset.id,
          })),
        });
      }

      return tx.auditCycle.findUniqueOrThrow({
        where: { id: cycle.id },
        include: {
          assignments: {
            include: { auditor: { select: { id: true, name: true, email: true } } },
          },
          items: { include: { asset: true } },
        },
      });
    });

    await logActivity(session.id, "CREATE_AUDIT", "AuditCycle", audit.id);
    return ok({ audit }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
