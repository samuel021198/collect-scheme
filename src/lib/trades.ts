import fs from "node:fs";
import path from "node:path";
import seedPosts from "../../data/trades.seed.json";
import { validatePost, validateReply } from "./catalog";
import { getCard } from "./content";
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

export function listPosts(): TradePost[] {
  const local = readLocal();
  const byId = new Map<string, TradePost>();
  for (const post of seedPosts as TradePost[]) byId.set(post.id, merge(post, local));
  for (const post of local.posts) byId.set(post.id, merge(post, local));
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getPost(id: string) {
  return listPosts().find((post) => post.id === id) ?? null;
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

  return withLock(() => {
    const local = readLocal();
    if (local.posts.length >= MAX_POSTS) return { ok: false, error: "full" as const };
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

  return withLock(() => {
    const post = getPost(postId);
    if (!post) return { ok: false, error: "not_found" as const };
    if (post.replies.length >= MAX_REPLIES) return { ok: false, error: "full" as const };
    const local = readLocal();
    const reply: Reply = {
      id: crypto.randomUUID(),
      author,
      body: replyBody,
      createdAt: new Date().toISOString(),
    };
    local.extraReplies[postId] = [...(local.extraReplies[postId] ?? []), reply];
    writeLocal(local);
    return { ok: true, id: reply.id };
  });
}
