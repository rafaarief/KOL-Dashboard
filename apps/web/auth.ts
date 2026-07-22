import crypto from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db";
import { recordAudit } from "@/lib/auditLog";
import { normalizeUsername } from "@/lib/slugify";
import { authConfig } from "./auth.config";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "")
        .toLowerCase()
        .trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const db = getDb();
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (!user?.passwordHash) return null;
      if (user.status === "suspended") return null;

      const valid = await compare(password, user.passwordHash);
      if (!valid) return null;

      await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

      if (user.role === "admin" || user.role === "outreach_admin") {
        void recordAudit({ actorUserId: user.id, action: `${user.role}.login`, entityType: "user", entityId: user.id });
      }

      return { id: user.id, email: user.email, name: user.fullName ?? undefined, role: user.role };
    },
  }),
];

// Google OAuth is opt-in: without real credentials from a Google Cloud Console OAuth client,
// this provider is simply omitted so deployments without those secrets never crash NextAuth.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    /** Google sign-in must never create a duplicate account for an email that already has a
     * `users` row — whether it was manually onboarded by an outreach_admin (PRD case 1) or
     * registered with a password (PRD case 3) — it links to that existing row instead. Only a
     * genuinely new email creates a new account (PRD case 2). See PRD "Module 5 — Google Login",
     * constraint: "Never duplicate users." */
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;

      const db = getDb();
      const email = user.email.toLowerCase().trim();
      const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

      if (existing) {
        if (existing.status === "suspended") return false;
        user.id = existing.id;
        user.role = existing.role;
        await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, existing.id));
        return true;
      }

      // Brand-new email — self-registration via Google. The register page sets a short-lived
      // cookie right before calling signIn("google") so we know whether they clicked through
      // from /register/creator or /register/brand; defaults to "creator" if absent (e.g. someone
      // uses the Google button on the generic /login page with no prior account) — that page
      // always clears the cookie itself (see GoogleSignInButton.tsx) so a stale value from an
      // abandoned register-page attempt can never leak into an unrelated later sign-in.
      const cookieStore = cookies();
      const intendedRole = cookieStore.get("oc_oauth_role")?.value === "brand" ? "brand" : "creator";

      // Wrapped in a transaction so a profile-insert failure (e.g. a username collision) can
      // never leave behind an orphaned `users` row with no matching profile.
      const created = await db.transaction(async (tx) => {
        const [createdUser] = await tx
          .insert(schema.users)
          .values({ email, fullName: user.name ?? email, role: intendedRole })
          .returning({ id: schema.users.id });

        if (intendedRole === "creator") {
          const base = normalizeUsername(email.split("@")[0] ?? "") || "creator";
          let username = `${base}-${createdUser.id.slice(0, 6)}`;
          const [usernameTaken] = await tx
            .select({ id: schema.creatorProfiles.id })
            .from(schema.creatorProfiles)
            .where(eq(schema.creatorProfiles.username, username))
            .limit(1);
          if (usernameTaken) username = `${base}-${crypto.randomUUID().slice(0, 8)}`;

          await tx.insert(schema.creatorProfiles).values({
            userId: createdUser.id,
            username,
            displayName: user.name ?? email,
          });
        } else {
          await tx.insert(schema.brandProfiles).values({
            userId: createdUser.id,
            slug: `brand-${createdUser.id.slice(0, 8)}`,
            brandName: user.name ?? email,
          });
        }

        return createdUser;
      });

      user.id = created.id;
      user.role = intendedRole;
      return true;
    },
  },
});
