import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { matchesPrint, searchNamedCards, type PrintLang } from "./catalog";
import { loadCards } from "./content";
import { databaseUrl, ensureDb, sql } from "./db";
import { rankSearches, type SearchEvent } from "./search-rank";
import type { CatalogCard } from "./types";

const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 2000;
const idOk = /^[A-Za-z0-9-]{1,40}$/;
const filePath = path.join(process.cwd(), "data", "searches.local.json");

export { rankSearches };

function readEvents(): SearchEvent[] {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as { events?: SearchEvent[] };
    return Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

function writeEvents(events: SearchEvent[]) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, JSON.stringify({ events }));
  renameSync(tmp, filePath);
}

let lastNote = "";

async function rememberCardFile(id: string, now: number) {
  const events = readEvents().filter((event) => now - event.at < WINDOW_MS);
  events.push({ id, at: now });
  writeEvents(events.slice(-MAX_EVENTS));
}

async function rememberCardDb(id: string, now: number) {
  await ensureDb();
  const q = sql();
  const at = new Date(now).toISOString();
  const cutoff = new Date(now - WINDOW_MS).toISOString();
  await q`INSERT INTO search_events (card_id, at) VALUES (${id}, ${at})`;
  await q`DELETE FROM search_events WHERE at < ${cutoff}`;
}

export async function rememberCard(id: string, now = Date.now()) {
  if (!idOk.test(id)) return;
  const stamp = `${id}@${Math.floor(now / 2000)}`;
  if (stamp === lastNote) return;
  lastNote = stamp;
  if (databaseUrl()) await rememberCardDb(id, now);
  else await rememberCardFile(id, now);
}

export async function rememberQuery(query: string, lang: PrintLang = "en", cards: CatalogCard[] = loadCards()) {
  const hit = searchNamedCards(cards, query, lang)[0];
  if (hit) await rememberCard(hit.id);
}

const recentIdsCached = unstable_cache(
  async () => {
    await ensureDb();
    const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
    const rows = await sql()`
      SELECT card_id, count(*)::int AS n, max(at) AS latest
      FROM search_events
      WHERE at >= ${cutoff}
      GROUP BY card_id
      ORDER BY n DESC, latest DESC, card_id ASC
      LIMIT 48
    `;
    return rows.map((row) => String(row.card_id));
  },
  ["recent-card-ids"],
  { revalidate: 120 },
);

async function recentIds(now: number) {
  if (!databaseUrl()) return rankSearches(existsSync(filePath) ? readEvents() : [], now, 48);
  try {
    return await recentIdsCached();
  } catch {
    return [];
  }
}

export async function recentCards(cards?: CatalogCard[], lang?: PrintLang) {
  const now = Date.now();
  const shelf = cards ?? loadCards();
  const byId = new Map(shelf.map((card) => [card.id, card]));
  const ids = await recentIds(now);
  return ids
    .map((id) => byId.get(id))
    .filter((card): card is CatalogCard => card != null && (lang == null || matchesPrint(card.region, lang)))
    .slice(0, 8);
}
