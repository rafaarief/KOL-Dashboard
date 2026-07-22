export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { slugify, normalizeUsername } from "@/lib/slugify";
import { isUniqueViolation } from "@/lib/pgErrors";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["creator", "brand"]),
  username: z.string().min(3).optional(),
  brandName: z.string().min(1).optional(),
});

/** Registration creates the shared `users` row plus the role-specific profile row in one
 * request — this is the only place OpenCollab accounts get created (no OAuth yet). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const { password, fullName, role } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  if (role === "creator" && !parsed.data.username) {
    return NextResponse.json({ error: "USERNAME_REQUIRED" }, { status: 400 });
  }
  if (role === "brand" && !parsed.data.brandName) {
    return NextResponse.json({ error: "BRAND_NAME_REQUIRED" }, { status: 400 });
  }

  const db = getDb();

  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existingUser) {
    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }

  if (role === "creator") {
    const username = normalizeUsername(parsed.data.username!);
    if (username.length < 3) {
      return NextResponse.json({ error: "INVALID_USERNAME" }, { status: 400 });
    }
    const [existingUsername] = await db
      .select()
      .from(schema.creatorProfiles)
      .where(eq(schema.creatorProfiles.username, username))
      .limit(1);
    if (existingUsername) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
  }

  const passwordHash = await hash(password, 10);

  // Wrapped in a transaction + unique-violation catch below: the pre-checks above are only a
  // fast path for the common case, not a real guard — two concurrent submits (double-click,
  // retry-on-timeout) can both pass them, and the second INSERT would otherwise throw the DB's
  // raw unique-constraint error uncaught instead of a clean EMAIL_TAKEN/USERNAME_TAKEN response.
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(schema.users)
        .values({ email, fullName, role, passwordHash })
        .returning({ id: schema.users.id });

      if (role === "creator") {
        const username = normalizeUsername(parsed.data.username!);
        await tx.insert(schema.creatorProfiles).values({
          userId: user.id,
          username,
          displayName: fullName,
        });
      } else {
        const baseSlug = slugify(parsed.data.brandName!);
        let slug = baseSlug || `brand-${user.id.slice(0, 8)}`;
        const [existingSlug] = await tx.select().from(schema.brandProfiles).where(eq(schema.brandProfiles.slug, slug)).limit(1);
        if (existingSlug) slug = `${slug}-${user.id.slice(0, 6)}`;

        await tx.insert(schema.brandProfiles).values({
          userId: user.id,
          slug,
          brandName: parsed.data.brandName!,
        });
      }
    });
  } catch (error) {
    if (isUniqueViolation(error, "users_email_unique")) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }
    if (isUniqueViolation(error, "creator_profiles_username_unique")) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    if (isUniqueViolation(error, "brand_profiles_slug_unique")) {
      return NextResponse.json({ error: "BRAND_NAME_TAKEN" }, { status: 409 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ error: "REGISTRATION_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
