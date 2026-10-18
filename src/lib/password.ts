import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LEN = 32;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, saltB64, keyB64] = stored.split("$");
  const salt = kind === "scrypt" && saltB64 ? Buffer.from(saltB64, "base64url") : Buffer.alloc(16, 1);
  const expected = kind === "scrypt" && keyB64 ? Buffer.from(keyB64, "base64url") : Buffer.alloc(KEY_LEN, 2);
  const key = await derive(password, salt.length > 0 ? salt : Buffer.alloc(16, 1));
  const same = expected.length === key.length && timingSafeEqual(key, expected);
  return kind === "scrypt" && same;
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 72;
}

export function displayName(value: unknown, email: string) {
  const typed = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  const source = typed || email.split("@")[0] || "collector";
  const name = source.slice(0, 20).trim();
  return name.length > 0 ? name : null;
}

export function safeNext(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return "/binders";
  }
  if (value.startsWith("/login")) return "/binders";
  return value;
}
