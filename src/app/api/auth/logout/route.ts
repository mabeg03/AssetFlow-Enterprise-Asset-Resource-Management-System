import { clearSessionCookie, getSession, logActivity } from "@/lib/auth";
import { handleRouteError, ok } from "../../_helpers";

export async function POST() {
  try {
    const session = await getSession();
    await clearSessionCookie();
    if (session) await logActivity(session.id, "LOGOUT", "User", session.id);

    return ok({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
