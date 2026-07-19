import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "kolfinder_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not set");
  return secret;
}

// Uses Web Crypto (globalThis.crypto) rather than node:crypto so this also works
// unmodified in the Edge runtime that Next.js middleware runs on by default.
async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(payload: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

export interface Session {
  email: string;
  issuedAt: number;
}

export function getAllowedEmails(): string[] {
  return (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function createSessionToken(email: string): Promise<string> {
  const payload = JSON.stringify({ email, issuedAt: Date.now() });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await sign(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const session = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as Session;
    if (Date.now() - session.issuedAt > SESSION_TTL_MS) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export const sessionCookieName = SESSION_COOKIE_NAME;
export const sessionMaxAgeSeconds = SESSION_TTL_MS / 1000;
