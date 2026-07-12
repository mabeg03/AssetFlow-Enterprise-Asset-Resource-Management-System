import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles } from "@/lib/auth";
import {
  handleRouteError,
  managerRoles,
  ok,
  optionalString,
  requiredString,
} from "../_helpers";

export async function GET() {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" },
    });

    return ok({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles(managerRoles);
    const body = await request.json();
    const category = await prisma.assetCategory.create({
      data: {
        name: requiredString(body.name, "name"),
        description: optionalString(body.description),
        customFieldsJson:
          body.customFieldsJson === undefined
            ? undefined
            : JSON.stringify(body.customFieldsJson),
      },
    });

    await logActivity(session.id, "CREATE_CATEGORY", "AssetCategory", category.id);
    return ok({ category }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
