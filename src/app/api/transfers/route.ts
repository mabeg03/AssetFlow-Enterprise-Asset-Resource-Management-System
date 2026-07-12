import { NextRequest } from "next/server";
import { AssetStatus, TransferStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  logActivity,
  notifyUser,
  requireRoles,
  requireSession,
} from "@/lib/auth";
import {
  handleRouteError,
  ok,
  optionalString,
  requiredString,
  transferApproverRoles,
} from "../_helpers";

export async function GET() {
  try {
    await requireSession();
    const transfers = await prisma.transferRequest.findMany({
      include: {
        asset: { include: { category: true } },
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ transfers });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const assetId = requiredString(body.assetId, "assetId");
    const toUserId = optionalString(body.toUserId);
    const toDepartmentId = optionalString(body.toDepartmentId);

    if (!toUserId && !toDepartmentId) {
      return jsonError("toUserId or toDepartmentId is required", 400);
    }

    const activeAllocation = await prisma.allocation.findFirst({
      where: { assetId, isActive: true },
      include: { holder: true },
    });
    if (!activeAllocation) return jsonError("Asset does not have an allocation conflict", 400);

    const transfer = await prisma.transferRequest.create({
      data: {
        assetId,
        fromUserId: activeAllocation.holderId,
        toUserId,
        toDepartmentId,
        requesterId: session.id,
        reason: optionalString(body.reason),
      },
      include: { asset: true },
    });

    await logActivity(session.id, "CREATE_TRANSFER", "TransferRequest", transfer.id);
    return ok({ transfer }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRoles(transferApproverRoles);
    const body = await request.json();
    const id = requiredString(body.id, "id");
    const action = requiredString(body.action, "action").toLowerCase();

    const transfer = await prisma.transferRequest.findUnique({
      where: { id },
      include: { asset: true, requester: true },
    });
    if (!transfer || transfer.status !== "REQUESTED") {
      return jsonError("Pending transfer request not found", 404);
    }

    if (action === "reject") {
      const rejected = await prisma.transferRequest.update({
        where: { id },
        data: { status: "REJECTED", approverId: session.id },
      });
      await notifyUser(
        transfer.requesterId,
        "Transfer rejected",
        `${transfer.asset.name} transfer request was rejected.`,
        "TRANSFER",
        `/transfers/${id}`
      );
      await logActivity(session.id, "REJECT_TRANSFER", "TransferRequest", id);
      return ok({ transfer: rejected });
    }

    if (action !== "approve") return jsonError("Invalid action", 400);

    const approved = await prisma.$transaction(async (tx) => {
      const activeAllocation = await tx.allocation.findFirst({
        where: { assetId: transfer.assetId, isActive: true },
      });

      if (activeAllocation) {
        await tx.allocation.update({
          where: { id: activeAllocation.id },
          data: { isActive: false, returnedAt: new Date(), returnNotes: "Transferred" },
        });
      }

      await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          holderId: transfer.toUserId,
          departmentId: transfer.toDepartmentId,
          allocatedById: session.id,
        },
      });

      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { status: "ALLOCATED" },
      });

      return tx.transferRequest.update({
        where: { id },
        data: { status: "COMPLETED", approverId: session.id },
      });
    });

    await notifyUser(
      transfer.requesterId,
      "Transfer approved",
      `${transfer.asset.name} transfer request was approved.`,
      "TRANSFER",
      `/transfers/${id}`
    );
    if (transfer.toUserId) {
      await notifyUser(
        transfer.toUserId,
        "Asset transferred to you",
        `${transfer.asset.name} has been allocated to you.`,
        "TRANSFER",
        `/assets/${transfer.assetId}`
      );
    }
    await logActivity(session.id, "APPROVE_TRANSFER", "TransferRequest", id);
    return ok({ transfer: approved });
  } catch (error) {
    return handleRouteError(error);
  }
}
