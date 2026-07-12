import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles } from "@/lib/auth";
import { applyDefined, handleRouteError, managerRoles, ok, optionalString } from "../../_helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoles(managerRoles);
    const { id } = await params;
    const body = await request.json();

    const category = await prisma.assetCategory.update({
      where: { id },
      data: applyDefined({
        name: optionalString(body.name),
        description: body.description === null ? null : optionalString(body.description),
        customFieldsJson:
          body.customFieldsJson === undefined
            ? undefined
            : JSON.stringify(body.customFieldsJson),
      }),
    });

    await logActivity(session.id, "UPDATE_CATEGORY", "AssetCategory", category.id);
    return ok({ category });
  } catch (error) {
    return handleRouteError(error);
  }
}
