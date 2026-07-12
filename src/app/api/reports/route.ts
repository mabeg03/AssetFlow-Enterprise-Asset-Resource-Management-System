import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/auth";
import { handleRouteError, managerRoles, ok } from "../_helpers";

export async function GET() {
  try {
    await requireRoles(managerRoles);

    const [statusCounts, maintenanceRequests, allocationCounts, bookings] =
      await Promise.all([
        prisma.asset.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.maintenanceRequest.findMany({
          include: { asset: { include: { category: true } } },
        }),
        prisma.allocation.groupBy({
          by: ["departmentId"],
          where: { isActive: true },
          _count: { _all: true },
        }),
        prisma.booking.findMany({ select: { startTime: true } }),
      ]);

    const maintenanceByCategory = maintenanceRequests.reduce<Record<string, number>>(
      (summary, request) => {
        const category = request.asset.category.name;
        summary[category] = (summary[category] || 0) + 1;
        return summary;
      },
      {}
    );

    const departmentIds = allocationCounts
      .map((count) => count.departmentId)
      .filter((id): id is string => Boolean(id));
    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true, code: true },
    });
    const departmentById = new Map(departments.map((department) => [department.id, department]));

    const bookingHeatmapByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
    }));
    for (const booking of bookings) {
      bookingHeatmapByHour[booking.startTime.getHours()].count += 1;
    }

    return ok({
      summary: {
        utilizationByStatus: statusCounts.map((count) => ({
          status: count.status,
          count: count._count._all,
        })),
        maintenanceByCategory,
        departmentAllocationCounts: allocationCounts.map((count) => ({
          department: count.departmentId
            ? departmentById.get(count.departmentId) || null
            : null,
          count: count._count._all,
        })),
        bookingHeatmapByHour,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
