import { NextRequest } from "next/server";
import { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles } from "@/lib/auth";
import { applyDefined, handleRouteError, ok, optionalString } from "../../_helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoles(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const parentId = optionalString(body.parentId);

    if (parentId === id) throw new Error("Invalid parentId");

    const department = await prisma.department.update({
      where: { id },
      data: applyDefined({
        name: optionalString(body.name),
        code: optionalString(body.code)?.toUpperCase(),
        status: optionalString(body.status),
        headId: optionalString(body.headId) ?? (body.headId === null ? null : undefined),
        parentId: parentId ?? (body.parentId === null ? null : undefined),
      }),
      include: { parent: true, head: true },
    });

    await logActivity(session.id, "UPDATE_DEPARTMENT", "Department", department.id);
    return ok({ department });
  } catch (error) {
    return handleRouteError(error);
  }
}
