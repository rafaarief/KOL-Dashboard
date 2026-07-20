import type { NextAuthConfig } from "next-auth";

/** KOL Finder / Business Leads API routes predate role-based auth entirely (the original
 * MVP had a single shared-password gate that was later removed — see project history) and
 * were only ever protected at the PAGE level by this same middleware. Now that those pages
 * live under /admin, their underlying API routes must be admin-gated too, or anyone who
 * knows the URL can call them directly (trigger a paid Apify scrape, read search history,
 * dump the leads CRM) without ever passing through the /admin page gate. */
const ADMIN_ONLY_API_PREFIXES = [
  "/api/admin",
  "/api/searches",
  "/api/shortlists",
  "/api/creators",
  "/api/kols",
  "/api/dashboard",
  "/api/leads",
  "/api/categories",
];

/** Edge-safe subset of the Auth.js config — used by middleware.ts directly. No DB or bcrypt
 * imports here (those need the Node.js runtime); the Credentials provider itself is only
 * added in auth.ts, which is never imported by middleware. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.userId = (user as { id?: string }).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "creator";
        session.user.id = token.userId as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const role = auth?.user?.role;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin") || ADMIN_ONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return role === "admin";
      }
      if (pathname.startsWith("/dashboard/creator") || pathname.startsWith("/api/creator")) {
        return role === "creator" || role === "admin";
      }
      if (pathname.startsWith("/dashboard/brand") || pathname.startsWith("/api/brand")) {
        return role === "brand" || role === "admin";
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
