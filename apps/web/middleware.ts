import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/creator/:path*",
    "/api/brand/:path*",
    // KOL Finder / Business Leads API routes — see the comment on ADMIN_ONLY_API_PREFIXES
    // in auth.config.ts for why these need the same gate as their /admin pages.
    "/api/searches/:path*",
    "/api/shortlists/:path*",
    "/api/creators/:path*",
    "/api/kols/:path*",
    "/api/dashboard/:path*",
    "/api/leads/:path*",
    "/api/categories/:path*",
  ],
};
