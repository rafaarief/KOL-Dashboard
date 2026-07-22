import { auth } from "@/auth";

/** Defense-in-depth on top of middleware: every /api/admin, /api/creator, /api/brand route
 * re-checks the session role itself rather than trusting middleware alone. */
export async function requireRole(roles: Array<"admin" | "creator" | "brand" | "outreach_admin">) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role as "admin" | "creator" | "brand" | "outreach_admin")) {
    return null;
  }
  return session;
}
