import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let client: Sql | null = null;
let ready: Promise<void> | null = null;

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function sql() {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!client) client = neon(url);
  return client;
}

export function ensureDb() {
  if (!databaseUrl()) return Promise.resolve();
  ready ??= migrate();
  return ready;
}

async function migrate() {
  const q = sql();
  await q`CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    nick text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await q`CREATE TABLE IF NOT EXISTS trade_posts (
    id text PRIMARY KEY,
    side text NOT NULL,
    card jsonb NOT NULL,
    description text NOT NULL,
    contact text NOT NULL,
    author text NOT NULL,
    created_at timestamptz NOT NULL
  )`;
  await q`CREATE TABLE IF NOT EXISTS trade_replies (
    id text PRIMARY KEY,
    post_id text NOT NULL,
    author text NOT NULL,
    body text NOT NULL,
    created_at timestamptz NOT NULL
  )`;
  await q`CREATE INDEX IF NOT EXISTS trade_replies_post_idx ON trade_replies (post_id)`;
  await q`CREATE TABLE IF NOT EXISTS search_events (
    card_id text NOT NULL,
    at timestamptz NOT NULL
  )`;
  await q`CREATE INDEX IF NOT EXISTS search_events_at_idx ON search_events (at)`;
  await q`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`;
  await q`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`;
  await q`CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email)`;
  await q`CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await q`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`;
  await q`CREATE TABLE IF NOT EXISTS binders (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name text NOT NULL,
    cover_card_id text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await q`CREATE INDEX IF NOT EXISTS binders_user_idx ON binders (user_id)`;
  await q`CREATE TABLE IF NOT EXISTS binder_cards (
    binder_id text NOT NULL REFERENCES binders (id) ON DELETE CASCADE,
    card_id text NOT NULL,
    status text NOT NULL,
    finish text,
    added_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (binder_id, card_id)
  )`;
}
