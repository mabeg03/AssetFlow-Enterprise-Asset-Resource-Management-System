import { NextRequest } from "next/server";
import { AssetStatus, MaintenanceStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  logActivity,
  notifyUser,
  requireRoles,
} from "@/lib/auth";
import {
  handleRouteError,
  managerRoles,
  ok,
  optionalString,
  requiredString,
} from "../../_helpers";

const userSummary = { id: true, name: true, email: true } as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoles(managerRoles);
    const { id } = await params;
    const body = await request.json();
    const action = requiredString(body.action, "action").toLowerCase();

    const current = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!current) return jsonError("Maintenance request not found", 404);

    const maintenance = await prisma.$transaction(async (tx) => {
      if (action === "approve") {
        await tx.asset.update({
          where: { id: current.assetId },
          data: { status: "UNDER_MAINTENANCE" },
        });
        return tx.maintenanceRequest.update({
          where: { id },
          data: { status: "APPROVED", approverId: session.id },
          include: {
            asset: true,
            requester: { select: userSummary },
            technician: { select: userSummary },
          },
        });
      }

      if (action === "reject") {
        return tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            approverId: session.id,
            rejectionReason: optionalString(body.reason),
          },
          include: {
            asset: true,
            requester: { select: userSummary },
            technician: { select: userSummary },
          },
        });
      }

      if (action === "assign") {
        return tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: "TECHNICIAN_ASSIGNED",
            technicianId: requiredString(body.technicianId, "technicianId"),
          },
          include: {
            asset: true,
            requester: { select: userSummary },
            technician: { select: userSummary },
          },
        });
      }

      if (action === "start") {
        return tx.maintenanceRequest.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
          include: {
            asset: true,
            requester: { select: userSummary },
            technician: { select: userSummary },
          },
        });
      }

      if (action === "resolve") {
        const activeAllocation = await tx.allocation.findFirst({
          where: { assetId: current.assetId, isActive: true },
        });
        await tx.asset.update({
          where: { id: current.assetId },
          data: { status: activeAllocation ? "ALLOCATED" : "AVAILABLE" },
        });
        return tx.maintenanceRequest.update({
          where: { id },
          data: {
            status: "RESOLVED",
            resolutionNotes: optionalString(body.resolutionNotes),
          },
          include: {
            asset: true,
            requester: { select: userSummary },
            technician: { select: userSummary },
          },
        });
      }

      throw new Error("Invalid action");
    });

    await notifyUser(
      maintenance.requesterId,
      "Maintenance updated",
      `${maintenance.asset.name} maintenance is ${maintenance.status}.`,
      "MAINTENANCE",
      `/maintenance/${id}`
    );
    await logActivity(session.id, `MAINTENANCE_${action.toUpperCase()}`, "MaintenanceRequest", id);
    return ok({ maintenance });
  } catch (error) {
    return handleRouteError(error);
  }
}
