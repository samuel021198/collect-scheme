import { randomBytes } from "node:crypto";
import { getCard } from "./content";
import { databaseUrl, ensureDb, sql } from "./db";
import { cleanCardIds, cleanCondition, cleanQuantity, type ConditionType } from "./grades";

export type CollectionItem = {
  id: string;
  cardId: string;
  condition: ConditionType;
  grade: string;
  quantity: number;
  updatedAt: string;
};

export type CollectionCode = "condition" | "quantity" | "missing" | "unavailable" | "generic";

function newId() {
  return `c_${randomBytes(9).toString("base64url")}`;
}

function rowItem(row: Record<string, unknown>): CollectionItem | null {
  const condition = cleanCondition(row.condition_type, row.grade || undefined);
  if (!condition && row.condition_type !== "raw") return null;
  const kind = (condition?.condition ?? "raw") as ConditionType;
  return {
    id: String(row.id),
    cardId: String(row.card_id),
    condition: kind,
    grade: String(row.grade ?? ""),
    quantity: Number(row.quantity) || 1,
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function listCollection(userId: string) {
  if (!databaseUrl()) return [];
  await ensureDb();
  const rows = await sql()`
    SELECT id, card_id, condition_type, grade, quantity, updated_at
    FROM collection_items
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC, id ASC
  `;
  return rows.map((row) => rowItem(row)).filter((item): item is CollectionItem => item != null);
}

export async function collectionForCard(userId: string, cardId: string) {
  if (!databaseUrl()) return [];
  await ensureDb();
  const rows = await sql()`
    SELECT id, card_id, condition_type, grade, quantity, updated_at
    FROM collection_items
    WHERE user_id = ${userId} AND card_id = ${cardId}
    ORDER BY updated_at DESC, id ASC
  `;
  return rows.map((row) => rowItem(row)).filter((item): item is CollectionItem => item != null);
}

export async function addCollection(
  userId: string,
  input: { cardId?: unknown; condition?: unknown; grade?: unknown; quantity?: unknown },
) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  const card = typeof input.cardId === "string" ? await getCard(input.cardId) : null;
  const condition = cleanCondition(input.condition, input.grade);
  const quantity = cleanQuantity(input.quantity ?? 1);
  if (!card) return { ok: false as const, error: "missing" as const };
  if (!condition) return { ok: false as const, error: "condition" as const };
  if (!quantity) return { ok: false as const, error: "quantity" as const };
  await ensureDb();
  const rows = await sql()`
    INSERT INTO collection_items (id, user_id, card_id, condition_type, grade, quantity)
    VALUES (${newId()}, ${userId}, ${card.id}, ${condition.condition}, ${condition.grade}, ${quantity})
    ON CONFLICT (user_id, card_id, condition_type, grade)
    DO UPDATE SET quantity = LEAST(collection_items.quantity + EXCLUDED.quantity, 99), updated_at = now()
    RETURNING id, quantity
  `;
  return { ok: true as const, id: String(rows[0]?.id), quantity: Number(rows[0]?.quantity) || quantity };
}

export async function addCollectionMany(userId: string, cardIds: unknown, quantity: unknown) {
  const ids = cleanCardIds(cardIds);
  const copies = cleanQuantity(quantity);
  if (!copies || ids.length === 0) return { ok: false as const, error: "quantity" as const };
  let added = 0;
  for (const cardId of ids) {
    const result = await addCollection(userId, { cardId, condition: "raw", quantity: copies });
    if (result.ok) added += 1;
  }
  if (added === 0) return { ok: false as const, error: "missing" as const };
  return { ok: true as const, added };
}

export async function slotCounts(userId: string) {
  if (!databaseUrl()) return new Map<string, number>();
  await ensureDb();
  const rows = await sql()`
    SELECT s.collection_item_id, count(*)::int AS slotted
    FROM binder_slots s
    JOIN collection_items c ON c.id = s.collection_item_id
    WHERE c.user_id = ${userId}
    GROUP BY s.collection_item_id
  `;
  return new Map(rows.map((row) => [String(row.collection_item_id), Number(row.slotted) || 0]));
}

async function releaseSlots(userId: string, itemId: string, amount: number) {
  await sql()`
    DELETE FROM binder_slots
    WHERE id IN (
      SELECT s.id
      FROM binder_slots s
      JOIN collection_items c ON c.id = s.collection_item_id
      WHERE c.user_id = ${userId} AND c.id = ${itemId}
      ORDER BY s.page_index, s.row_index, s.col_index
      LIMIT ${amount}
    )
  `;
}

export async function dropCollection(userId: string, itemId: string, requested: unknown, release = false) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  const amount = cleanQuantity(requested);
  if (!amount) return { ok: false as const, error: "quantity" as const };
  await ensureDb();
  const q = sql();
  const removed = await q`
    DELETE FROM collection_items
    WHERE id = ${itemId} AND user_id = ${userId} AND quantity = ${amount}
    RETURNING id
  `;
  if (removed[0]) return { ok: true as const, quantity: 0 };
  const updated = await q`
    UPDATE collection_items
    SET quantity = quantity - ${amount}, updated_at = now()
    WHERE id = ${itemId} AND user_id = ${userId} AND quantity > ${amount}
    RETURNING quantity
  `;
  if (updated[0]) {
    if (release) await releaseSlots(userId, itemId, amount);
    return { ok: true as const, quantity: Number(updated[0].quantity) };
  }
  const exists = await q`SELECT id FROM collection_items WHERE id = ${itemId} AND user_id = ${userId}`;
  if (!exists[0]) return { ok: false as const, error: "missing" as const };
  return { ok: false as const, error: "quantity" as const };
}
