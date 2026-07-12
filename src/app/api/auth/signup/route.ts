import { NextRequest } from "next/server";
import { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { hashPassword, jsonError, logActivity } from "@/lib/auth";
import { handleRouteError, ok, optionalString, requiredString } from "../../_helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = requiredString(body.name, "name");
    const email = requiredString(body.email, "email").toLowerCase();
    const password = requiredString(body.password, "password");
    const departmentId = optionalString(body.departmentId);

    if (password.length < 6) return jsonError("Password must be at least 6 characters", 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("Email already exists", 409);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "EMPLOYEE",
        departmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        department: true,
        createdAt: true,
      },
    });

    await logActivity(user.id, "SIGNUP", "User", user.id);
    return ok({ user }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
