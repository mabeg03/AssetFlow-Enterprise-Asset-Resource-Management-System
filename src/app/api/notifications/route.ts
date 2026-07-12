import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleRouteError, ok, optionalString } from "../_helpers";

export async function GET() {
  try {
    const session = await requireSession();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return ok({ notifications });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const id = optionalString(body.id);

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: session.id },
        data: { isRead: true },
      });
      const notification = await prisma.notification.findFirst({
        where: { id, userId: session.id },
      });

      if (!notification) throw new Error("Invalid notification id");

      return ok({ notification });
    }

    const result = await prisma.notification.updateMany({
      where: { userId: session.id, isRead: false },
      data: { isRead: true },
    });

    return ok({ updated: result.count });
  } catch (error) {
    return handleRouteError(error);
  }
}
