import { randomBytes } from "node:crypto";
import { getCard } from "./content";
import { databaseUrl, ensureDb, sql } from "./db";
import { cleanBinderName, cleanFinish, cleanStatus, type BinderStatus } from "./binder-rules";

const MAX_BINDERS = 24;
const MAX_CARDS = 2000;

export type BinderSummary = {
  id: string;
  name: string;
  coverCardId: string | null;
  owned: number;
  total: number;
};

export type BinderSlot = {
  cardId: string;
  status: BinderStatus;
  finish: string | null;
};

export type BinderCode = "name" | "auth" | "missing" | "full" | "unavailable" | "generic";

function newId() {
  return `b_${randomBytes(9).toString("base64url")}`;
}

function unavailable(): { ok: false; error: BinderCode } {
  return { ok: false, error: "unavailable" };
}

async function ownedBinder(userId: string, binderId: string) {
  const rows = await sql()`SELECT id, name, cover_card_id FROM binders WHERE id = ${binderId} AND user_id = ${userId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function listBinders(userId: string): Promise<BinderSummary[]> {
  if (!databaseUrl()) return [];
  await ensureDb();
  const rows = await sql()`
    SELECT b.id, b.name, b.cover_card_id,
      count(c.card_id)::int AS total,
      count(c.card_id) FILTER (WHERE c.status = 'owned')::int AS owned
    FROM binders b
    LEFT JOIN binder_cards c ON c.binder_id = b.id
    WHERE b.user_id = ${userId}
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    coverCardId: row.cover_card_id ? String(row.cover_card_id) : null,
    owned: Number(row.owned) || 0,
    total: Number(row.total) || 0,
  }));
}

export async function binderSlots(userId: string, binderId: string): Promise<{ binder: BinderSummary; slots: BinderSlot[] } | null> {
  if (!databaseUrl()) return null;
  await ensureDb();
  const binder = await ownedBinder(userId, binderId);
  if (!binder) return null;
  const rows = await sql()`
    SELECT card_id, status, finish
    FROM binder_cards
    WHERE binder_id = ${binderId}
    ORDER BY added_at ASC, card_id ASC
  `;
  const slots = rows
    .map((row) => {
      const status = cleanStatus(row.status);
      if (!status) return null;
      return { cardId: String(row.card_id), status, finish: row.finish ? String(row.finish) : null };
    })
    .filter((slot): slot is BinderSlot => slot != null);
  const owned = slots.filter((slot) => slot.status === "owned").length;
  return {
    binder: {
      id: String(binder.id),
      name: String(binder.name),
      coverCardId: binder.cover_card_id ? String(binder.cover_card_id) : null,
      owned,
      total: slots.length,
    },
    slots,
  };
}

export async function binderChoices(userId: string, cardId: string) {
  if (!databaseUrl()) return [];
  await ensureDb();
  const rows = await sql()`
    SELECT b.id, b.name, c.status
    FROM binders b
    LEFT JOIN binder_cards c ON c.binder_id = b.id AND c.card_id = ${cardId}
    WHERE b.user_id = ${userId}
    ORDER BY b.created_at DESC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    status: cleanStatus(row.status),
  }));
}

export async function createBinder(userId: string, name: unknown, card?: { cardId: unknown; status: unknown; finish: unknown }) {
  if (!databaseUrl()) return unavailable();
  const clean = cleanBinderName(name);
  if (!clean) return { ok: false as const, error: "name" as const };
  await ensureDb();
  const q = sql();
  const count = await q`SELECT count(*)::int AS n FROM binders WHERE user_id = ${userId}`;
  if (Number(count[0]?.n) >= MAX_BINDERS) return { ok: false as const, error: "full" as const };
  const id = newId();
  await q`INSERT INTO binders (id, user_id, name) VALUES (${id}, ${userId}, ${clean})`;
  if (card) {
    const added = await setBinderCard(userId, id, card.cardId, card.status, card.finish);
    if (!added.ok && added.error !== "missing") return added;
  }
  return { ok: true as const, id };
}

export async function renameBinder(userId: string, binderId: string, name: unknown) {
  if (!databaseUrl()) return unavailable();
  const clean = cleanBinderName(name);
  if (!clean) return { ok: false as const, error: "name" as const };
  await ensureDb();
  const rows = await sql()`UPDATE binders SET name = ${clean} WHERE id = ${binderId} AND user_id = ${userId} RETURNING id`;
  if (!rows[0]) return { ok: false as const, error: "missing" as const };
  return { ok: true as const };
}

export async function setBinderCover(userId: string, binderId: string, cardId: unknown) {
  if (!databaseUrl()) return unavailable();
  if (typeof cardId !== "string") return { ok: false as const, error: "missing" as const };
  await ensureDb();
  const rows = await sql()`
    UPDATE binders SET cover_card_id = ${cardId}
    WHERE id = ${binderId} AND user_id = ${userId}
      AND EXISTS (SELECT 1 FROM binder_cards WHERE binder_id = ${binderId} AND card_id = ${cardId})
    RETURNING id
  `;
  if (!rows[0]) return { ok: false as const, error: "missing" as const };
  return { ok: true as const };
}

export async function deleteBinder(userId: string, binderId: string) {
  if (!databaseUrl()) return unavailable();
  await ensureDb();
  const rows = await sql()`DELETE FROM binders WHERE id = ${binderId} AND user_id = ${userId} RETURNING id`;
  if (!rows[0]) return { ok: false as const, error: "missing" as const };
  return { ok: true as const };
}

export async function setBinderCard(userId: string, binderId: string, cardId: unknown, status: unknown, finish: unknown) {
  if (!databaseUrl()) return unavailable();
  const next = cleanStatus(status);
  const card = typeof cardId === "string" ? await getCard(cardId) : null;
  const mark = cleanFinish(finish);
  if (!next || !card) return { ok: false as const, error: "missing" as const };
  await ensureDb();
  const q = sql();
  const binder = await ownedBinder(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  const size = await q`SELECT count(*)::int AS n FROM binder_cards WHERE binder_id = ${binderId}`;
  const existing = await q`SELECT 1 FROM binder_cards WHERE binder_id = ${binderId} AND card_id = ${card.id} LIMIT 1`;
  if (!existing[0] && Number(size[0]?.n) >= MAX_CARDS) return { ok: false as const, error: "full" as const };
  await q`
    INSERT INTO binder_cards (binder_id, card_id, status, finish)
    VALUES (${binderId}, ${card.id}, ${next}, ${mark})
    ON CONFLICT (binder_id, card_id)
    DO UPDATE SET status = EXCLUDED.status, finish = COALESCE(EXCLUDED.finish, binder_cards.finish)
  `;
  return { ok: true as const };
}

export async function removeBinderCard(userId: string, binderId: string, cardId: string) {
  if (!databaseUrl()) return unavailable();
  await ensureDb();
  const binder = await ownedBinder(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  await sql()`DELETE FROM binder_cards WHERE binder_id = ${binderId} AND card_id = ${cardId}`;
  if (binder.cover_card_id === cardId) {
    await sql()`UPDATE binders SET cover_card_id = NULL WHERE id = ${binderId}`;
  }
  return { ok: true as const };
}
