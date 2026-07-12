import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleRouteError, ok } from "../_helpers";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;

    const employees = await prisma.user.findMany({
      where: {
        departmentId,
        status,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return ok({ employees });
  } catch (error) {
    return handleRouteError(error);
  }
}
