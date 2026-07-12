import { NextRequest } from "next/server";
import { BookingStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { jsonError, logActivity, requireSession } from "@/lib/auth";
import { handleRouteError, ok, optionalString, requiredString } from "../_helpers";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const assetId = request.nextUrl.searchParams.get("assetId") || undefined;

    const bookings = await prisma.booking.findMany({
      where: { assetId },
      include: {
        asset: { include: { category: true } },
        bookedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return ok({ bookings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const assetId = requiredString(body.assetId, "assetId");
    const startTime = new Date(requiredString(body.startTime, "startTime"));
    const endTime = new Date(requiredString(body.endTime, "endTime"));

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return jsonError("Invalid booking time", 400);
    }
    if (endTime <= startTime) return jsonError("endTime must be after startTime", 400);

    const overlap = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { not: "CANCELLED" },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (overlap) return jsonError("Booking overlaps an existing booking", 409);

    const booking = await prisma.booking.create({
      data: {
        assetId,
        bookedById: session.id,
        startTime,
        endTime,
        purpose: optionalString(body.purpose),
      },
      include: { asset: true },
    });

    await logActivity(session.id, "CREATE_BOOKING", "Booking", booking.id);
    return ok({ booking }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
