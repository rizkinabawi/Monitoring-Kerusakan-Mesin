import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDatabase } from "./db";
import { users } from "./schema";

const COOKIE_NAME = "machine_monitoring_session";
const SESSION_SECONDS = 60 * 60 * 12;

export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: string;
};

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET wajib berisi minimal 32 karakter untuk menandatangani sesi.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer("machine-monitoring")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(sessionKey());
}

export function setSessionCookie(response: Response, token: string) {
  response.headers.append("Set-Cookie", sessionCookie(token, SESSION_SECONDS));
}

export function clearSessionCookie(response: Response) {
  response.headers.append("Set-Cookie", sessionCookie("", 0));
}

function sessionCookie(token: string, maxAge: number) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export async function getSessionUser(
  request: Request,
): Promise<SessionUser | null> {
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  const cookie = request.headers.get("cookie")?.split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const token = bearer ?? (cookie ? decodeURIComponent(cookie) : undefined);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      issuer: "machine-monitoring",
    });
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1) return null;

    const [user] = await getDatabase()
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("SESSION_SECRET")) {
      throw error;
    }
    return null;
  }
}

export const sessionCookieName = COOKIE_NAME;