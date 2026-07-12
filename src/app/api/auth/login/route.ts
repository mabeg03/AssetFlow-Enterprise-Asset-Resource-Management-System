import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  jsonError,
  logActivity,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { Role } from "@/lib/types";
import { handleRouteError, ok, requiredString } from "../../_helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = requiredString(body.email, "email").toLowerCase();
    const password = requiredString(body.password, "password");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user || user.status !== "ACTIVE") return jsonError("Invalid credentials", 401);

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) return jsonError("Invalid credentials", 401);

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      departmentId: user.departmentId,
    });
    await setSessionCookie(token);
    await logActivity(user.id, "LOGIN", "User", user.id);

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
