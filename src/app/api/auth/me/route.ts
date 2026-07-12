import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleRouteError, ok } from "../../_helpers";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
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
    });

    if (!user || user.status !== "ACTIVE") throw new Error("UNAUTHORIZED");
    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
