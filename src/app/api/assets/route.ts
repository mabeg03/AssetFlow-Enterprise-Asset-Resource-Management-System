import { NextRequest } from "next/server";
import { AssetCondition, AssetStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { logActivity, requireRoles, requireSession } from "@/lib/auth";
import {
  handleRouteError,
  managerRoles,
  ok,
  optionalDate,
  optionalString,
  parseBoolean,
  requiredString,
} from "../_helpers";

function formatAssetTag(value: number) {
  return `AF-${String(value).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status") as AssetStatus | null;
    const categoryId = searchParams.get("categoryId") || undefined;
    const location = searchParams.get("location") || undefined;
    const isShared = parseBoolean(searchParams.get("isShared"));

    const assets = await prisma.asset.findMany({
      where: {
        status: status || undefined,
        categoryId,
        location: location ? { contains: location } : undefined,
        isShared,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { assetTag: { contains: q } },
                { serialNumber: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        allocations: {
          where: { isActive: true },
          include: {
            holder: { select: { id: true, name: true, email: true } },
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ assets });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoles(managerRoles);
    const body = await request.json();
    const name = requiredString(body.name, "name");
    const categoryId = requiredString(body.categoryId, "categoryId");

    const asset = await prisma.$transaction(async (tx) => {
      const counter = await tx.assetCounter.upsert({
        where: { id: 1 },
        create: { id: 1, value: 1 },
        update: { value: { increment: 1 } },
      });

      return tx.asset.create({
        data: {
          name,
          assetTag: formatAssetTag(counter.value),
          serialNumber: optionalString(body.serialNumber),
          categoryId,
          acquisitionDate: optionalDate(body.acquisitionDate),
          acquisitionCost:
            body.acquisitionCost === undefined ? undefined : Number(body.acquisitionCost),
          condition: (optionalString(body.condition) as AssetCondition) || "GOOD",
          location: optionalString(body.location),
          isShared: Boolean(body.isShared),
          photoUrl: optionalString(body.photoUrl),
          notes: optionalString(body.notes),
        },
        include: { category: true },
      });
    });

    await logActivity(session.id, "CREATE_ASSET", "Asset", asset.id, asset.assetTag);
    return ok({ asset }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
