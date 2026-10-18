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
  await q`ALTER TABLE binders ADD COLUMN IF NOT EXISTS page_layout text NOT NULL DEFAULT '3x3'`;
  // BGS subgrades and TAG tag_score (100–1000) are not stored yet.
  await q`CREATE TABLE IF NOT EXISTS collection_items (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    card_id text NOT NULL,
    condition_type text NOT NULL,
    grade text NOT NULL DEFAULT '',
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await q`CREATE UNIQUE INDEX IF NOT EXISTS collection_items_key ON collection_items (user_id, card_id, condition_type, grade)`;
  await q`CREATE INDEX IF NOT EXISTS collection_items_user_idx ON collection_items (user_id, updated_at DESC)`;
  await q`CREATE TABLE IF NOT EXISTS binder_pages (
    binder_id text NOT NULL REFERENCES binders (id) ON DELETE CASCADE,
    page_index integer NOT NULL,
    PRIMARY KEY (binder_id, page_index)
  )`;
  await q`CREATE TABLE IF NOT EXISTS binder_slots (
    id text PRIMARY KEY,
    binder_id text NOT NULL REFERENCES binders (id) ON DELETE CASCADE,
    page_index integer NOT NULL,
    row_index integer NOT NULL,
    col_index integer NOT NULL,
    collection_item_id text NOT NULL REFERENCES collection_items (id) ON DELETE CASCADE,
    UNIQUE (binder_id, page_index, row_index, col_index)
  )`;
}
