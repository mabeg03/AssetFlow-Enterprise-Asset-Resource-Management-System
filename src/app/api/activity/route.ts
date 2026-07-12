import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";
import { handleRouteError, managerRoles, ok } from "../_helpers";

export async function GET(request: NextRequest) {
  try {
    await requireRoles(managerRoles);
    const limit = Number(request.nextUrl.searchParams.get("limit") || 100);

    const logs = await prisma.activityLog.findMany({
      take: Math.min(Math.max(limit, 1), 250),
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok({ logs });
  } catch (error) {
    return handleRouteError(error);
  }
}
