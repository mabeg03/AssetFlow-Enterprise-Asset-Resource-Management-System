import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleRouteError, ok } from "../_helpers";

export async function GET() {
  try {
    await requireSession();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const sevenDaysOut = new Date(now);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

    const [
      totalAssets,
      availableAssets,
      activeAllocations,
      openMaintenance,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueAllocations,
      pendingMaintenance,
      pendingTransferRows,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "AVAILABLE" } }),
      prisma.allocation.count({ where: { isActive: true } }),
      prisma.maintenanceRequest.count({
        where: { status: { notIn: ["RESOLVED", "REJECTED"] } },
      }),
      prisma.maintenanceRequest.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.booking.count({
        where: {
          status: { in: ["UPCOMING", "ONGOING"] },
          endTime: { gte: now },
        },
      }),
      prisma.transferRequest.count({ where: { status: "REQUESTED" } }),
      prisma.allocation.findMany({
        where: {
          isActive: true,
          expectedReturnDate: { gte: now, lte: sevenDaysOut },
        },
        include: {
          asset: { select: { name: true, assetTag: true } },
          holder: { select: { name: true } },
        },
        take: 10,
      }),
      prisma.allocation.findMany({
        where: {
          isActive: true,
          OR: [{ isOverdue: true }, { expectedReturnDate: { lt: now } }],
        },
        include: {
          asset: { select: { name: true, assetTag: true } },
          holder: { select: { name: true } },
        },
        take: 20,
      }),
      prisma.maintenanceRequest.findMany({
        where: { status: "PENDING" },
        include: { asset: { select: { name: true, assetTag: true } } },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transferRequest.findMany({
        where: { status: "REQUESTED" },
        include: { asset: { select: { name: true, assetTag: true } } },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Mark overdue flags for dashboard consistency
    await prisma.allocation.updateMany({
      where: {
        isActive: true,
        expectedReturnDate: { lt: now },
        isOverdue: false,
      },
      data: { isOverdue: true },
    });

    const pendingApprovals = [
      ...pendingMaintenance.map((m) => ({
        id: m.id,
        title: `Maintenance: ${m.asset.name}`,
        type: "MAINTENANCE",
        createdAt: m.createdAt,
      })),
      ...pendingTransferRows.map((t) => ({
        id: t.id,
        title: `Transfer: ${t.asset.name}`,
        type: "TRANSFER",
        createdAt: t.createdAt,
      })),
    ];

    return ok({
      totalAssets,
      availableAssets,
      activeAllocations,
      openMaintenance,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns: upcomingReturns.length,
      overdueReturns: overdueAllocations.length,
      overdueAllocations,
      upcomingReturnRows: upcomingReturns,
      pendingApprovals,
      kpis: {
        available: availableAssets,
        allocated: activeAllocations,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        upcomingReturns: upcomingReturns.length,
        overdueReturns: overdueAllocations.length,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
