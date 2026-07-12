import { NextRequest } from "next/server";
import { AssetCondition, AssetStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { jsonError, logActivity, requireRoles, requireSession } from "@/lib/auth";
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
    const allocations = await prisma.allocation.findMany({
      include: {
        asset: { include: { category: true } },
        holder: { select: { id: true, name: true, email: true } },
        department: true,
        allocatedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ allocations });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles(managerRoles);
    const body = await request.json();
    const assetId = requiredString(body.assetId, "assetId");
    const holderId = optionalString(body.holderId);
    const departmentId = optionalString(body.departmentId);

    if (!holderId && !departmentId) return jsonError("holderId or departmentId is required", 400);

    const activeAllocation = await prisma.allocation.findFirst({
      where: { assetId, isActive: true },
      include: {
        holder: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });

    if (activeAllocation) {
      return ok(
        {
          error: "Asset already has an active allocation",
          holder: activeAllocation.holder,
          department: activeAllocation.department,
          suggestion: "Create a transfer request for this asset.",
        },
        { status: 409 }
      );
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const created = await tx.allocation.create({
        data: {
          assetId,
          holderId,
          departmentId,
          allocatedById: session.id,
          expectedReturnDate: optionalDate(body.expectedReturnDate),
          returnCondition: optionalString(body.condition) as AssetCondition | undefined,
        },
        include: {
          asset: true,
          holder: { select: { id: true, name: true, email: true } },
          department: true,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: "ALLOCATED" },
      });

      return created;
    });

    await logActivity(session.id, "ALLOCATE_ASSET", "Allocation", allocation.id, assetId);
    return ok({ allocation }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
