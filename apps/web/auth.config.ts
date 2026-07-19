import type { NextAuthConfig } from "next-auth";

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

      if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return role === "admin";
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
