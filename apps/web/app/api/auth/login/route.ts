import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, getAllowedEmails, sessionCookieName, sessionMaxAgeSeconds } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * MVP internal auth: a shared password plus an email allowlist (FR-001). Not meant to
 * survive past internal MVP — swap for Supabase Auth before any external rollout.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const expectedPassword = process.env.APP_PASSWORD;
  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
    return NextResponse.json({ error: "EMAIL_NOT_ALLOWED" }, { status: 403 });
  }

  const token = await createSessionToken(normalizedEmail);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
  });

  return response;
}
