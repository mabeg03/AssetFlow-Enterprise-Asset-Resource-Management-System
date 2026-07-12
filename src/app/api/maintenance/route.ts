import { NextRequest } from "next/server";
import { MaintenancePriority } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { logActivity, requireSession } from "@/lib/auth";
import { handleRouteError, ok, optionalString, requiredString } from "../_helpers";

export async function GET() {
  try {
    await requireSession();
    const maintenance = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { include: { category: true } },
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ maintenance });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        assetId: requiredString(body.assetId, "assetId"),
        requesterId: session.id,
        description: requiredString(body.description, "description"),
        priority:
          (optionalString(body.priority) as MaintenancePriority) ||
          "MEDIUM",
        photoUrl: optionalString(body.photoUrl),
      },
      include: { asset: true },
    });

    await logActivity(session.id, "CREATE_MAINTENANCE", "MaintenanceRequest", maintenance.id);
    return ok({ maintenance }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
