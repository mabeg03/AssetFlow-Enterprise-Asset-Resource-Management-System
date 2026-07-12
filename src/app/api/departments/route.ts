import { NextRequest } from "next/server";
import { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles } from "@/lib/auth";
import { handleRouteError, ok, optionalString, requiredString } from "../_helpers";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        parent: { select: { id: true, name: true, code: true } },
        head: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true, children: true, allocations: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok({ departments });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles(["ADMIN"]);
    const body = await request.json();
    const name = requiredString(body.name, "name");
    const code = requiredString(body.code, "code").toUpperCase();

    const department = await prisma.department.create({
      data: {
        name,
        code,
        parentId: optionalString(body.parentId),
        headId: optionalString(body.headId),
      },
      include: { parent: true, head: true },
    });

    await logActivity(session.id, "CREATE_DEPARTMENT", "Department", department.id);
    return ok({ department }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
