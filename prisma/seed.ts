import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditAssignment.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.assetCounter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const it = await prisma.department.create({
    data: { name: "Information Technology", code: "IT", status: "ACTIVE" },
  });
  const hr = await prisma.department.create({
    data: { name: "Human Resources", code: "HR", status: "ACTIVE" },
  });
  const ops = await prisma.department.create({
    data: { name: "Operations", code: "OPS", status: "ACTIVE" },
  });

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@assetflow.com",
      passwordHash,
      role: "ADMIN",
      departmentId: it.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Aisha Khan",
      email: "manager@assetflow.com",
      passwordHash,
      role: "ASSET_MANAGER",
      departmentId: it.id,
    },
  });

  const head = await prisma.user.create({
    data: {
      name: "Rohan Mehta",
      email: "head@assetflow.com",
      passwordHash,
      role: "DEPARTMENT_HEAD",
      departmentId: ops.id,
    },
  });

  await prisma.department.update({
    where: { id: ops.id },
    data: { headId: head.id },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@assetflow.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: it.id,
    },
  });

  const raj = await prisma.user.create({
    data: {
      name: "Raj Patel",
      email: "raj@assetflow.com",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: ops.id,
    },
  });

  const electronics = await prisma.assetCategory.create({
    data: {
      name: "Electronics",
      description: "Laptops, phones, monitors",
      customFieldsJson: JSON.stringify({ warrantyMonths: 24 }),
    },
  });
  const furniture = await prisma.assetCategory.create({
    data: { name: "Furniture", description: "Desks, chairs, cabinets" },
  });
  const vehicles = await prisma.assetCategory.create({
    data: { name: "Vehicles", description: "Company cars and vans" },
  });
  const rooms = await prisma.assetCategory.create({
    data: { name: "Meeting Rooms", description: "Bookable shared spaces" },
  });

  await prisma.assetCounter.create({ data: { id: 1, value: 6 } });

  const laptop = await prisma.asset.create({
    data: {
      name: "MacBook Pro 14",
      assetTag: "AF-0001",
      serialNumber: "MBP14-77821",
      categoryId: electronics.id,
      acquisitionDate: new Date("2024-03-12"),
      acquisitionCost: 185000,
      condition: "EXCELLENT",
      location: "Floor 3 - IT Bay",
      status: "ALLOCATED",
    },
  });

  const monitor = await prisma.asset.create({
    data: {
      name: "Dell UltraSharp 27",
      assetTag: "AF-0002",
      serialNumber: "DU27-99102",
      categoryId: electronics.id,
      acquisitionDate: new Date("2023-11-02"),
      acquisitionCost: 32000,
      condition: "GOOD",
      location: "Floor 2 - Ops",
      status: "AVAILABLE",
    },
  });

  const desk = await prisma.asset.create({
    data: {
      name: "Standing Desk Pro",
      assetTag: "AF-0003",
      serialNumber: "SDP-441",
      categoryId: furniture.id,
      acquisitionCost: 18000,
      condition: "GOOD",
      location: "Floor 3",
      status: "AVAILABLE",
    },
  });

  const car = await prisma.asset.create({
    data: {
      name: "Toyota Innova Fleet-1",
      assetTag: "AF-0004",
      serialNumber: "MH12AB1234",
      categoryId: vehicles.id,
      acquisitionCost: 2100000,
      condition: "GOOD",
      location: "Parking A",
      status: "AVAILABLE",
      isShared: true,
    },
  });

  const roomB2 = await prisma.asset.create({
    data: {
      name: "Conference Room B2",
      assetTag: "AF-0005",
      categoryId: rooms.id,
      condition: "EXCELLENT",
      location: "Floor 2",
      status: "AVAILABLE",
      isShared: true,
    },
  });

  const projector = await prisma.asset.create({
    data: {
      name: "Epson Laser Projector",
      assetTag: "AF-0006",
      serialNumber: "EP-2201",
      categoryId: electronics.id,
      acquisitionCost: 75000,
      condition: "FAIR",
      location: "AV Closet",
      status: "AVAILABLE",
      isShared: true,
    },
  });

  const expectedReturn = new Date();
  expectedReturn.setDate(expectedReturn.getDate() - 2);

  await prisma.allocation.create({
    data: {
      assetId: laptop.id,
      holderId: priya.id,
      departmentId: it.id,
      allocatedById: manager.id,
      expectedReturnDate: expectedReturn,
      isActive: true,
      isOverdue: true,
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(10, 0, 0, 0);

  await prisma.booking.create({
    data: {
      assetId: roomB2.id,
      bookedById: raj.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      purpose: "Ops standup",
      status: "UPCOMING",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: projector.id,
      requesterId: head.id,
      description: "Lamp flickering during presentations",
      priority: "HIGH",
      status: "PENDING",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: priya.id,
        title: "Overdue Return Alert",
        message: "MacBook Pro 14 (AF-0001) is past its expected return date.",
        type: "OVERDUE_RETURN",
        link: "/allocations",
      },
      {
        userId: manager.id,
        title: "Maintenance Request Pending",
        message: "Epson Laser Projector needs approval for repair.",
        type: "MAINTENANCE",
        link: "/maintenance",
      },
      {
        userId: raj.id,
        title: "Booking Confirmed",
        message: "Conference Room B2 booked for tomorrow 9:00–10:00.",
        type: "BOOKING",
        link: "/bookings",
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: "SETUP_ORG",
        entityType: "Organization",
        details: "Seeded departments, categories, and demo users",
      },
      {
        actorId: manager.id,
        action: "ALLOCATE_ASSET",
        entityType: "Asset",
        entityId: laptop.id,
        details: "Allocated AF-0001 to Priya Sharma",
      },
    ],
  });

  console.log("Seed complete. Demo logins (password: password123):");
  console.log("  admin@assetflow.com (Admin)");
  console.log("  manager@assetflow.com (Asset Manager)");
  console.log("  head@assetflow.com (Department Head)");
  console.log("  priya@assetflow.com / raj@assetflow.com (Employee)");
  void desk;
  void hr;
  void car;
  void monitor;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
