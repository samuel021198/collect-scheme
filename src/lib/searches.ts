import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { searchNamedCards } from "./catalog";
import { loadCards } from "./content";
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

export function rememberCard(id: string, now = Date.now()) {
  if (!idOk.test(id)) return;
  const stamp = `${id}@${Math.floor(now / 2000)}`;
  if (stamp === lastNote) return;
  lastNote = stamp;
  const events = readEvents().filter((event) => now - event.at < WINDOW_MS);
  events.push({ id, at: now });
  writeEvents(events.slice(-MAX_EVENTS));
}

export function rememberQuery(query: string, cards: CatalogCard[] = loadCards()) {
  const en = searchNamedCards(cards, query, "en")[0];
  const ja = searchNamedCards(cards, query, "ja")[0];
  if (en) rememberCard(en.id);
  if (ja && ja.id !== en?.id) rememberCard(ja.id);
}

export function recentCards(cards: CatalogCard[] = loadCards(), now = Date.now()) {
  if (!existsSync(filePath)) return [];
  const byId = new Map(cards.map((card) => [card.id, card]));
  return rankSearches(readEvents(), now)
    .map((id) => byId.get(id))
    .filter((card): card is CatalogCard => card != null);
}
