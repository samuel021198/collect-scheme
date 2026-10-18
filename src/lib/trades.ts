import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import seedPosts from "../../data/trades.seed.json";
import { validatePost, validateReply } from "./catalog";
import { getCard } from "./content";
import { databaseUrl, ensureDb, sql } from "./db";
import type { CardSnap, CatalogCard, ErrorCode, Reply, TradePost } from "./types";

type LocalFile = {
  posts: TradePost[];
  extraReplies: Record<string, Reply[]>;
};

const localPath = path.join(process.cwd(), "data", "trades.local.json");
const MAX_POSTS = 200;
const MAX_REPLIES = 40;

// ponytail: one in-process queue. Move posts and replies into a Postgres transaction
// (Supabase or Prisma) before running more than one server instance.
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => T): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function emptyLocal(): LocalFile {
  return { posts: [], extraReplies: {} };
}

function readLocal(): LocalFile {
  try {
    const parsed = JSON.parse(fs.readFileSync(localPath, "utf8")) as LocalFile;
    if (!parsed || !Array.isArray(parsed.posts) || typeof parsed.extraReplies !== "object") {
      return emptyLocal();
    }
    return parsed;
  } catch {
    return emptyLocal();
  }
}

function writeLocal(data: LocalFile) {
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  const tmp = `${localPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, localPath);
}

function merge(post: TradePost, local: LocalFile): TradePost {
  const extra = local.extraReplies[post.id] ?? [];
  return {
    ...post,
    replies: [...post.replies, ...extra].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

function listPostsFile(): TradePost[] {
  const local = readLocal();
  const byId = new Map<string, TradePost>();
  for (const post of seedPosts as TradePost[]) byId.set(post.id, merge(post, local));
  for (const post of local.posts) byId.set(post.id, merge(post, local));
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

let seeded = false;

async function seedDatabase() {
  if (seeded) return;
  const q = sql();
  for (const post of seedPosts as TradePost[]) {
    await q`INSERT INTO trade_posts (id, side, card, description, contact, author, created_at)
      VALUES (${post.id}, ${post.side}, ${JSON.stringify(post.card)}::jsonb, ${post.description}, ${post.contact}, ${post.author}, ${post.createdAt})
      ON CONFLICT (id) DO NOTHING`;
    for (const reply of post.replies) {
      await q`INSERT INTO trade_replies (id, post_id, author, body, created_at)
        VALUES (${reply.id}, ${post.id}, ${reply.author}, ${reply.body}, ${reply.createdAt})
        ON CONFLICT (id) DO NOTHING`;
    }
  }
  seeded = true;
}

async function listPostsDb(): Promise<TradePost[]> {
  await ensureDb();
  await seedDatabase();
  const q = sql();
  const [posts, replies] = await Promise.all([
    q`SELECT id, side, card, description, contact, author, created_at FROM trade_posts`,
    q`SELECT id, post_id, author, body, created_at FROM trade_replies`,
  ]);
  const byPost = new Map<string, Reply[]>();
  for (const reply of replies) {
    const postId = String(reply.post_id);
    const list = byPost.get(postId) ?? [];
    list.push({
      id: String(reply.id),
      author: String(reply.author),
      body: String(reply.body),
      createdAt: iso(reply.created_at),
    });
    byPost.set(postId, list);
  }
  return posts
    .map((post) => {
      const side: TradePost["side"] = post.side === "buy" ? "buy" : "sell";
      return {
      id: String(post.id),
      side,
      card: post.card as CardSnap,
      description: String(post.description),
      contact: String(post.contact),
      author: String(post.author),
      createdAt: iso(post.created_at),
      replies: (byPost.get(String(post.id)) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPosts(): Promise<TradePost[]> {
  if (!databaseUrl()) return listPostsFile();
  return listPostsDb();
}

export const listPostsCached = unstable_cache(async () => listPosts(), ["trade-posts"], { revalidate: 60 });

export async function getPost(id: string) {
  const posts = await listPosts();
  return posts.find((post) => post.id === id) ?? null;
}

function snap(card: CatalogCard): CardSnap {
  return {
    id: card.id,
    names: card.names,
    imageSmall: card.imageSmall,
    setName: card.setName,
    number: card.number,
    rarity: card.rarity,
  };
}

function readBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createPost(value: unknown): Promise<{ ok: true; id: string } | { ok: false; error: ErrorCode }> {
  const body = readBody(value);
  if (!body) return { ok: false, error: "generic" };
  const author = text(body.author);
  const side = text(body.side);
  const description = text(body.description);
  const contact = text(body.contact);
  const cardId = text(body.cardId);
  const invalid = validatePost({ author, side, description, contact, cardId });
  if (invalid) return { ok: false, error: invalid };

  const card = await getCard(cardId);
  if (!card) return { ok: false, error: "card" };

  const post: TradePost = {
    id: crypto.randomUUID(),
    side: side as "buy" | "sell",
    card: snap(card),
    description,
    contact,
    author,
    createdAt: new Date().toISOString(),
    replies: [],
  };

  if (databaseUrl()) {
    await ensureDb();
    const q = sql();
    const count = await q`SELECT count(*)::int AS n FROM trade_posts WHERE id NOT LIKE 'seed-%'`;
    if (Number(count[0]?.n ?? 0) >= MAX_POSTS) return { ok: false, error: "full" };
    await q`INSERT INTO trade_posts (id, side, card, description, contact, author, created_at)
      VALUES (${post.id}, ${post.side}, ${JSON.stringify(post.card)}::jsonb, ${post.description}, ${post.contact}, ${post.author}, ${post.createdAt})`;
    return { ok: true, id: post.id };
  }

  return withLock(() => {
    const local = readLocal();
    if (local.posts.length >= MAX_POSTS) return { ok: false, error: "full" as const };
    local.posts.push(post);
    writeLocal(local);
    return { ok: true, id: post.id };
  });
}

export async function addReply(
  postId: string,
  value: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: ErrorCode }> {
  const body = readBody(value);
  if (!body) return { ok: false, error: "generic" };
  const author = text(body.author);
  const replyBody = text(body.body);
  const invalid = validateReply({ author, body: replyBody });
  if (invalid) return { ok: false, error: invalid };
  if (!/^[A-Za-z0-9-]{1,80}$/.test(postId)) return { ok: false, error: "not_found" };

  const reply: Reply = {
    id: crypto.randomUUID(),
    author,
    body: replyBody,
    createdAt: new Date().toISOString(),
  };

  if (databaseUrl()) {
    const post = await getPost(postId);
    if (!post) return { ok: false, error: "not_found" };
    if (post.replies.length >= MAX_REPLIES) return { ok: false, error: "full" };
    const q = sql();
    await q`INSERT INTO trade_replies (id, post_id, author, body, created_at)
      VALUES (${reply.id}, ${postId}, ${reply.author}, ${reply.body}, ${reply.createdAt})`;
    return { ok: true, id: reply.id };
  }

  return withLock(() => {
    const post = listPostsFile().find((item) => item.id === postId);
    if (!post) return { ok: false, error: "not_found" as const };
    if (post.replies.length >= MAX_REPLIES) return { ok: false, error: "full" as const };
    const local = readLocal();
    local.extraReplies[postId] = [...(local.extraReplies[postId] ?? []), reply];
    writeLocal(local);
    return { ok: true, id: reply.id };
  });
}
