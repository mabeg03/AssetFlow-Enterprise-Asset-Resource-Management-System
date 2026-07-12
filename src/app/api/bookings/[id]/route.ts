import { NextRequest } from "next/server";
import { BookingStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { logActivity, requireSession } from "@/lib/auth";
import { handleRouteError, ok } from "../../_helpers";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { asset: true },
    });

    await logActivity(session.id, "CANCEL_BOOKING", "Booking", booking.id);
    return ok({ booking });
  } catch (error) {
    return handleRouteError(error);
  }
}
