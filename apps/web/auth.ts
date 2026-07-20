import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { recordAudit } from "@/lib/auditLog";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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

        if (user.role === "admin") {
          void recordAudit({ actorUserId: user.id, action: "admin.login", entityType: "user", entityId: user.id });
        }

        return { id: user.id, email: user.email, name: user.fullName ?? undefined, role: user.role };
      },
    }),
  ],
});
