import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "aas_owner_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

export type SessionPayload = {
  sub: "owner";
  exp: number;
};

export type AuthConfig = {
  email: string;
  passwordHash: string;
  secret: string;
};

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function getAuthConfig(): AuthConfig | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const secret = process.env.AUTH_SECRET?.trim();
  if (!email || !passwordHash || !secret || secret.length < 32) return null;
  return { email, passwordHash, secret };
}

export function createSessionToken(secret: string): string {
  const payload: SessionPayload = {
    sub: "owner",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string
): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (typeof parsed !== "object" || parsed === null) return null;
    const payload = parsed as Partial<SessionPayload>;
    if (payload.sub !== "owner" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { sub: "owner", exp: payload.exp };
  } catch {
    return null;
  }
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/login";
}
