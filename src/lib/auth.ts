import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { databaseUrl, ensureDb, sql } from "./db";
import { displayName, hashPassword, normalizeEmail, validPassword, verifyPassword } from "./password";

const COOKIE = "cs_session";
const MAX_AGE = 30 * 24 * 60 * 60;

export type Account = { id: string; name: string; email: string };

export type AuthCode = "email" | "password" | "taken" | "invalid" | "unavailable" | "generic";

function newId(prefix: string) {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function pgCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String(error.code);
}

export function sessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE,
    },
  };
}

export const currentUser = cache(async function currentUser(): Promise<Account | null> {
  if (!databaseUrl()) return null;
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    await ensureDb();
    const rows = await sql()`
      SELECT u.id, u.nick, u.email
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > now()
      LIMIT 1
    `;
    const row = rows[0];
    if (!row?.email) return null;
    return { id: String(row.id), name: String(row.nick), email: String(row.email) };
  } catch {
    return null;
  }
});

async function openSession(userId: string) {
  await ensureDb();
  const q = sql();
  const token = randomBytes(32).toString("base64url");
  const id = newId("s");
  const expires = new Date(Date.now() + MAX_AGE * 1000).toISOString();
  await q`DELETE FROM sessions WHERE expires_at <= now()`;
  await q`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (${id}, ${userId}, ${tokenHash(token)}, ${expires})`;
  return token;
}

export async function registerAccount(input: { email?: unknown; password?: unknown; name?: unknown }): Promise<
  { ok: true; token: string; user: Account } | { ok: false; error: AuthCode }
> {
  if (!databaseUrl()) return { ok: false, error: "unavailable" };
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "email" };
  if (!validPassword(input.password)) return { ok: false, error: "password" };
  const name = displayName(input.name, email);
  if (!name) return { ok: false, error: "generic" };
  const passwordHash = await hashPassword(input.password);
  await ensureDb();
  const q = sql();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = newId("u");
    const nick = attempt === 0 ? name : `${name.slice(0, 14)} ${randomBytes(2).toString("hex")}`.slice(0, 20);
    try {
      await q`INSERT INTO users (id, nick, email, password_hash) VALUES (${id}, ${nick}, ${email}, ${passwordHash})`;
      const token = await openSession(id);
      return { ok: true, token, user: { id, name: nick, email } };
    } catch (error) {
      if (pgCode(error) !== "23505") return { ok: false, error: "generic" };
      const detail = error instanceof Error ? error.message : "";
      if (detail.includes("email")) return { ok: false, error: "taken" };
    }
  }
  return { ok: false, error: "generic" };
}

export async function loginAccount(input: { email?: unknown; password?: unknown }): Promise<
  { ok: true; token: string; user: Account } | { ok: false; error: AuthCode }
> {
  if (!databaseUrl()) return { ok: false, error: "unavailable" };
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) return { ok: false, error: "invalid" };
  await ensureDb();
  const rows = await sql()`SELECT id, nick, email, password_hash FROM users WHERE email = ${email} LIMIT 1`;
  const row = rows[0];
  const stored = row?.password_hash ? String(row.password_hash) : "missing";
  const match = await verifyPassword(password, stored);
  if (!row?.email || !match) return { ok: false, error: "invalid" };
  const user = { id: String(row.id), name: String(row.nick), email: String(row.email) };
  const token = await openSession(user.id);
  return { ok: true, token, user };
}

export async function logoutAccount() {
  if (!databaseUrl()) return;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return;
  await ensureDb();
  await sql()`DELETE FROM sessions WHERE token_hash = ${tokenHash(token)}`;
}
