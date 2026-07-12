import { NextRequest } from "next/server";
import { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles } from "@/lib/auth";
import { applyDefined, handleRouteError, ok, optionalString } from "../../_helpers";

const promotableRoles = ["DEPARTMENT_HEAD", "ASSET_MANAGER", "EMPLOYEE"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoles(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const role = optionalString(body.role) as Role | undefined;

    if (role && !promotableRoles.includes(role)) throw new Error("Invalid role");

    const employee = await prisma.user.update({
      where: { id },
      data: applyDefined({
        role,
        status: optionalString(body.status),
        departmentId:
          optionalString(body.departmentId) ??
          (body.departmentId === null ? null : undefined),
      }),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: true,
        updatedAt: true,
      },
    });

    await logActivity(session.id, "UPDATE_EMPLOYEE", "User", employee.id);
    return ok({ employee });
  } catch (error) {
    return handleRouteError(error);
  }
}
