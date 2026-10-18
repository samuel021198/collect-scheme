import { randomBytes } from "node:crypto";
import { cache } from "react";
import { addCollection, type CollectionItem } from "./collection";
import { databaseUrl, ensureDb, sql } from "./db";
import { type ConditionType } from "./grades";
import { cleanBinderName, cleanLayout, layoutSize, packSlots, type BinderLayout } from "./binder-rules";

const MAX_BINDERS = 24;
const MAX_PAGES = 24;

export type BinderSummary = {
  id: string;
  name: string;
  layout: BinderLayout;
  pages: number;
  filled: number;
};

export type BinderSlot = {
  id: string;
  page: number;
  row: number;
  col: number;
  itemId: string;
  cardId: string;
  condition: ConditionType;
  grade: string;
  quantity: number;
};

type Fail = { ok: false; error: "name" | "layout" | "missing" | "full" | "taken" | "unavailable" | "condition" | "quantity" };

function newId(prefix: string) {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

function layoutOf(value: unknown): BinderLayout {
  return cleanLayout(value) ?? "3x3";
}

async function owned(userId: string, binderId: string) {
  const rows = await sql()`SELECT id, name, page_layout FROM binders WHERE id = ${binderId} AND user_id = ${userId} LIMIT 1`;
  return rows[0] ?? null;
}

async function ensurePage(binderId: string, page: number) {
  await sql()`INSERT INTO binder_pages (binder_id, page_index) VALUES (${binderId}, ${page}) ON CONFLICT DO NOTHING`;
}

export async function listBinders(userId: string): Promise<BinderSummary[]> {
  if (!databaseUrl()) return [];
  await ensureDb();
  const rows = await sql()`
    SELECT b.id, b.name, b.page_layout,
      (SELECT count(*)::int FROM binder_pages p WHERE p.binder_id = b.id) AS pages,
      (SELECT count(*)::int FROM binder_slots s WHERE s.binder_id = b.id) AS filled
    FROM binders b
    WHERE b.user_id = ${userId}
    ORDER BY b.created_at DESC
  `;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    layout: layoutOf(row.page_layout),
    pages: Number(row.pages) || 1,
    filled: Number(row.filled) || 0,
  }));
}

async function binderViewUncached(userId: string, binderId: string) {
  if (!databaseUrl()) return null;
  await ensureDb();
  const binder = await owned(userId, binderId);
  if (!binder) return null;
  await ensurePage(binderId, 0);
  const [pages, slots] = await Promise.all([
    sql()`SELECT page_index FROM binder_pages WHERE binder_id = ${binderId} ORDER BY page_index ASC`,
    sql()`
    SELECT s.id, s.page_index, s.row_index, s.col_index, s.collection_item_id,
      c.card_id, c.condition_type, c.grade, c.quantity
    FROM binder_slots s
    JOIN collection_items c ON c.id = s.collection_item_id
    WHERE s.binder_id = ${binderId}
    ORDER BY s.page_index, s.row_index, s.col_index
  `,
  ]);
  return {
    binder: {
      id: String(binder.id),
      name: String(binder.name),
      layout: layoutOf(binder.page_layout),
      pages: Math.max(pages.length, 1),
      filled: slots.length,
    },
    pageIndexes: pages.map((row) => Number(row.page_index)),
    slots: slots.map((row) => ({
      id: String(row.id),
      page: Number(row.page_index),
      row: Number(row.row_index),
      col: Number(row.col_index),
      itemId: String(row.collection_item_id),
      cardId: String(row.card_id),
      condition: String(row.condition_type) as ConditionType,
      grade: String(row.grade ?? ""),
      quantity: Number(row.quantity) || 1,
    })),
  };
}

export const binderView = cache(binderViewUncached);

export async function createBinder(userId: string, name: unknown, layout: unknown) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  const clean = cleanBinderName(name);
  const size = cleanLayout(layout) ?? "3x3";
  if (!clean) return { ok: false as const, error: "name" as const };
  await ensureDb();
  const count = await sql()`SELECT count(*)::int AS n FROM binders WHERE user_id = ${userId}`;
  if (Number(count[0]?.n) >= MAX_BINDERS) return { ok: false as const, error: "full" as const };
  const id = newId("b");
  await sql()`INSERT INTO binders (id, user_id, name, page_layout) VALUES (${id}, ${userId}, ${clean}, ${size})`;
  await ensurePage(id, 0);
  return { ok: true as const, id };
}

export async function renameBinder(userId: string, binderId: string, name: unknown) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  const clean = cleanBinderName(name);
  if (!clean) return { ok: false as const, error: "name" as const };
  await ensureDb();
  const rows = await sql()`UPDATE binders SET name = ${clean} WHERE id = ${binderId} AND user_id = ${userId} RETURNING id`;
  if (!rows[0]) return { ok: false as const, error: "missing" as const };
  return { ok: true as const };
}

export async function setBinderLayout(userId: string, binderId: string, layout: unknown) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  const next = cleanLayout(layout);
  if (!next) return { ok: false as const, error: "layout" as const };
  await ensureDb();
  const binder = await owned(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  const current = await sql()`
    SELECT id, collection_item_id
    FROM binder_slots
    WHERE binder_id = ${binderId}
    ORDER BY page_index, row_index, col_index, id
  `;
  const packed = packSlots(current.length, next);
  const pages = Math.max(1, packed.at(-1) ? packed[packed.length - 1].page + 1 : 1);
  if (pages > MAX_PAGES) return { ok: false as const, error: "full" as const };
  await sql()`DELETE FROM binder_slots WHERE binder_id = ${binderId}`;
  await sql()`DELETE FROM binder_pages WHERE binder_id = ${binderId}`;
  for (let page = 0; page < pages; page += 1) await ensurePage(binderId, page);
  for (let index = 0; index < current.length; index += 1) {
    const spot = packed[index];
    const item = current[index];
    if (!spot || !item) continue;
    await sql()`
      INSERT INTO binder_slots (id, binder_id, page_index, row_index, col_index, collection_item_id)
      VALUES (${String(item.id)}, ${binderId}, ${spot.page}, ${spot.row}, ${spot.col}, ${String(item.collection_item_id)})
    `;
  }
  await sql()`UPDATE binders SET page_layout = ${next} WHERE id = ${binderId}`;
  return { ok: true as const };
}

export async function deleteBinder(userId: string, binderId: string) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  await ensureDb();
  const rows = await sql()`DELETE FROM binders WHERE id = ${binderId} AND user_id = ${userId} RETURNING id`;
  if (!rows[0]) return { ok: false as const, error: "missing" as const };
  return { ok: true as const };
}

export async function addBinderPage(userId: string, binderId: string) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  await ensureDb();
  const binder = await owned(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  const pages = await sql()`SELECT COALESCE(max(page_index), -1)::int AS last FROM binder_pages WHERE binder_id = ${binderId}`;
  const next = Number(pages[0]?.last) + 1;
  if (next >= MAX_PAGES) return { ok: false as const, error: "full" as const };
  await ensurePage(binderId, next);
  return { ok: true as const, page: next };
}

async function firstEmpty(binderId: string, layout: BinderLayout) {
  const { cols, rows } = layoutSize(layout);
  const pages = await sql()`SELECT page_index FROM binder_pages WHERE binder_id = ${binderId} ORDER BY page_index`;
  const taken = await sql()`SELECT page_index, row_index, col_index FROM binder_slots WHERE binder_id = ${binderId}`;
  const used = new Set(taken.map((row) => `${row.page_index}:${row.row_index}:${row.col_index}`));
  for (const pageRow of pages) {
    const page = Number(pageRow.page_index);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!used.has(`${page}:${row}:${col}`)) return { page, row, col };
      }
    }
  }
  const page = pages.length;
  if (page >= MAX_PAGES) return null;
  await ensurePage(binderId, page);
  return { page, row: 0, col: 0 };
}

async function ownItem(userId: string, itemId: string) {
  const rows = await sql()`
    SELECT id FROM collection_items WHERE id = ${itemId} AND user_id = ${userId} LIMIT 1
  `;
  return rows[0] ? String(rows[0].id) : null;
}

export async function placeInBinder(
  userId: string,
  binderId: string,
  input: {
    collectionItemId?: unknown;
    cardId?: unknown;
    condition?: unknown;
    grade?: unknown;
    quantity?: unknown;
    page?: unknown;
    row?: unknown;
    col?: unknown;
  },
) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  await ensureDb();
  const binder = await owned(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  const layout = layoutOf(binder.page_layout);
  let itemId = typeof input.collectionItemId === "string" ? await ownItem(userId, input.collectionItemId) : null;
  if (!itemId && input.cardId) {
    const added = await addCollection(userId, input);
    if (!added.ok) return added;
    itemId = added.id;
  }
  if (!itemId) return { ok: false as const, error: "missing" as const };
  const { cols, rows } = layoutSize(layout);
  let spot =
    typeof input.page === "number" && typeof input.row === "number" && typeof input.col === "number"
      ? { page: input.page, row: input.row, col: input.col }
      : null;
  if (spot && (spot.page < 0 || spot.row < 0 || spot.row >= rows || spot.col < 0 || spot.col >= cols || spot.page >= MAX_PAGES)) {
    return { ok: false as const, error: "missing" as const };
  }
  spot ??= await firstEmpty(binderId, layout);
  if (!spot) return { ok: false as const, error: "full" as const };
  await ensurePage(binderId, spot.page);
  const occupied = await sql()`
    SELECT id FROM binder_slots
    WHERE binder_id = ${binderId} AND page_index = ${spot.page} AND row_index = ${spot.row} AND col_index = ${spot.col}
    LIMIT 1
  `;
  if (occupied[0]) return { ok: false as const, error: "taken" as const };
  await sql()`
    INSERT INTO binder_slots (id, binder_id, page_index, row_index, col_index, collection_item_id)
    VALUES (${newId("s")}, ${binderId}, ${spot.page}, ${spot.row}, ${spot.col}, ${itemId})
  `;
  return { ok: true as const, itemId };
}

export async function clearSlot(userId: string, binderId: string, page: number, row: number, col: number) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  await ensureDb();
  const binder = await owned(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  await sql()`
    DELETE FROM binder_slots
    WHERE binder_id = ${binderId} AND page_index = ${page} AND row_index = ${row} AND col_index = ${col}
  `;
  return { ok: true as const };
}

export async function moveSlot(
  userId: string,
  binderId: string,
  from: { page: number; row: number; col: number },
  to: { page: number; row: number; col: number },
) {
  if (!databaseUrl()) return { ok: false as const, error: "unavailable" as const };
  await ensureDb();
  const binder = await owned(userId, binderId);
  if (!binder) return { ok: false as const, error: "missing" as const };
  const { cols, rows } = layoutSize(layoutOf(binder.page_layout));
  const inside = (spot: { page: number; row: number; col: number }) =>
    spot.page >= 0 && spot.page < MAX_PAGES && spot.row >= 0 && spot.row < rows && spot.col >= 0 && spot.col < cols;
  if (!inside(from) || !inside(to)) return { ok: false as const, error: "missing" as const };
  const slots = await sql()`
    SELECT id, page_index, row_index, col_index, collection_item_id
    FROM binder_slots
    WHERE binder_id = ${binderId}
      AND ((page_index = ${from.page} AND row_index = ${from.row} AND col_index = ${from.col})
        OR (page_index = ${to.page} AND row_index = ${to.row} AND col_index = ${to.col}))
  `;
  const source = slots.find((slot) => Number(slot.page_index) === from.page && Number(slot.row_index) === from.row && Number(slot.col_index) === from.col);
  const target = slots.find((slot) => Number(slot.page_index) === to.page && Number(slot.row_index) === to.row && Number(slot.col_index) === to.col);
  if (!source) return { ok: false as const, error: "missing" as const };
  if (source === target || (from.page === to.page && from.row === to.row && from.col === to.col)) return { ok: true as const };
  await ensurePage(binderId, to.page);
  await sql()`DELETE FROM binder_slots WHERE id = ${String(source.id)}`;
  if (target) await sql()`DELETE FROM binder_slots WHERE id = ${String(target.id)}`;
  await sql()`
    INSERT INTO binder_slots (id, binder_id, page_index, row_index, col_index, collection_item_id)
    VALUES (${String(source.id)}, ${binderId}, ${to.page}, ${to.row}, ${to.col}, ${String(source.collection_item_id)})
  `;
  if (target) {
    await sql()`
      INSERT INTO binder_slots (id, binder_id, page_index, row_index, col_index, collection_item_id)
      VALUES (${String(target.id)}, ${binderId}, ${from.page}, ${from.row}, ${from.col}, ${String(target.collection_item_id)})
    `;
  }
  return { ok: true as const };
}

export type { CollectionItem, Fail };
