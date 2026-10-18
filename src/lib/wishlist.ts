import { getCard } from "./content";
import { databaseUrl, ensureDb, sql } from "./db";
import type { CatalogCard } from "./types";

export async function wishState(userId: string, cardId: string) {
  if (!databaseUrl()) return false;
  await ensureDb();
  const rows = await sql()`SELECT card_id FROM wishlist_items WHERE user_id = ${userId} AND card_id = ${cardId}`;
  return Boolean(rows[0]);
}

export async function toggleWish(userId: string, cardId: string) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  const card = await getCard(cardId);
  if (!card) return { ok: false as const, error: "missing" as const };
  await ensureDb();
  const q = sql();
  const inserted = await q`
    INSERT INTO wishlist_items (user_id, card_id)
    VALUES (${userId}, ${card.id})
    ON CONFLICT (user_id, card_id) DO NOTHING
    RETURNING card_id
  `;
  if (inserted[0]) return { ok: true as const, wished: true };
  await q`DELETE FROM wishlist_items WHERE user_id = ${userId} AND card_id = ${card.id}`;
  return { ok: true as const, wished: false };
}

export async function listWishes(userId: string): Promise<CatalogCard[]> {
  if (!databaseUrl()) return [];
  await ensureDb();
  const rows = await sql()`
    SELECT card_id FROM wishlist_items
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, card_id ASC
  `;
  const cards = await Promise.all(rows.map((row) => getCard(String(row.card_id))));
  return cards.filter((card): card is CatalogCard => card != null);
}
