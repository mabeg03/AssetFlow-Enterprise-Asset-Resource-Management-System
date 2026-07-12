import { NextRequest } from "next/server";
import { AssetCondition, AssetStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { jsonError, logActivity, requireRoles, requireSession } from "@/lib/auth";
import {
  applyDefined,
  handleRouteError,
  managerRoles,
  ok,
  optionalDate,
  optionalString,
} from "../../_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        allocations: {
          include: {
            holder: { select: { id: true, name: true, email: true } },
            department: true,
            allocatedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        maintenance: {
          include: {
            requester: { select: { id: true, name: true, email: true } },
            technician: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: { orderBy: { startTime: "desc" } },
      },
    });

    if (!asset) return jsonError("Asset not found", 404);
    return ok({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoles(managerRoles);
    const { id } = await params;
    const body = await request.json();

    const asset = await prisma.asset.update({
      where: { id },
      data: applyDefined({
        name: optionalString(body.name),
        serialNumber: body.serialNumber === null ? null : optionalString(body.serialNumber),
        categoryId: optionalString(body.categoryId),
        acquisitionDate:
          body.acquisitionDate === null ? null : optionalDate(body.acquisitionDate),
        acquisitionCost:
          body.acquisitionCost === null
            ? null
            : body.acquisitionCost === undefined
              ? undefined
              : Number(body.acquisitionCost),
        condition: optionalString(body.condition) as AssetCondition | undefined,
        location: body.location === null ? null : optionalString(body.location),
        status: optionalString(body.status) as AssetStatus | undefined,
        isShared: body.isShared === undefined ? undefined : Boolean(body.isShared),
        photoUrl: body.photoUrl === null ? null : optionalString(body.photoUrl),
        notes: body.notes === null ? null : optionalString(body.notes),
      }),
      include: { category: true },
    });

    await logActivity(session.id, "UPDATE_ASSET", "Asset", asset.id, asset.assetTag);
    return ok({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}
