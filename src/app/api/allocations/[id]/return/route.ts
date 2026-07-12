import { NextRequest } from "next/server";
import { AssetCondition, AssetStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { jsonError, logActivity, requireRoles } from "@/lib/auth";
import { handleRouteError, managerRoles, ok, optionalString } from "../../../_helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoles(managerRoles);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.allocation.findUnique({ where: { id } });
    if (!existing || !existing.isActive) return jsonError("Active allocation not found", 404);

    const allocation = await prisma.$transaction(async (tx) => {
      const returned = await tx.allocation.update({
        where: { id },
        data: {
          isActive: false,
          returnedAt: new Date(),
          returnNotes: optionalString(body.notes),
          returnCondition: optionalString(body.condition) as AssetCondition | undefined,
        },
        include: {
          asset: true,
          holder: { select: { id: true, name: true, email: true } },
          department: true,
        },
      });

      await tx.asset.update({
        where: { id: returned.assetId },
        data: { status: "AVAILABLE" },
      });

      return returned;
    });

    await logActivity(session.id, "RETURN_ASSET", "Allocation", allocation.id);
    return ok({ allocation });
  } catch (error) {
    return handleRouteError(error);
  }
}
