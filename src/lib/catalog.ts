import type { CardNames, CatalogCard, ErrorCode } from "./types";

export const FILTERS = [
  "Grass",
  "Fire",
  "Water",
  "Lightning",
  "Psychic",
  "Fighting",
  "Darkness",
  "Metal",
  "Fairy",
  "Dragon",
  "Colorless",
  "Trainer",
] as const;

const NICK = /^[\p{L}\p{N}_.-]{2,20}$/u;

export function cardTitle(names: CardNames, locale: string) {
  if (locale === "zh" && names.zh) return names.zh;
  return names.en;
}

export function cardSubtitle(names: CardNames, locale: string) {
  const title = cardTitle(names, locale);
  if (title === names.en) return names.zh ?? null;
  return names.en;
}

export type PrintLang = "en" | "ja";
export type SearchKind = "card" | "set";

export function parsePrintLang(value: string | undefined): PrintLang {
  if (value === "ja" || value === "jp") return "ja";
  return "en";
}

export function parseSearchKind(value: string | undefined): SearchKind {
  return value === "set" ? "set" : "card";
}

export function matchesPrint(region: string | undefined, lang: PrintLang) {
  const print = region === "jp" ? "jp" : "intl";
  return lang === "ja" ? print === "jp" : print === "intl";
}

export function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function squeeze(value: string) {
  return fold(value).replace(/[&＆\s]+/g, "");
}

function isLatinWordChar(char: string) {
  return /[a-z0-9]/i.test(char);
}

function latinRank(name: string, query: string): number | null {
  const allowPrefix = query.length >= 4;
  let best: number | null = null;
  let from = 0;
  while (from < name.length) {
    const index = name.indexOf(query, from);
    if (index < 0) break;
    const before = index === 0 ? "" : name[index - 1];
    const after = name[index + query.length] ?? "";
    const beforeOk = index === 0 || !isLatinWordChar(before);
    const afterOk = after === "" || !isLatinWordChar(after);
    if (beforeOk && (afterOk || allowPrefix)) {
      const rank = index === 0 ? 1 : 2;
      best = best == null ? rank : Math.min(best, rank);
      if (best === 1) return 1;
    }
    from = index + Math.max(query.length, 1);
  }
  return best;
}

function cjkRank(name: string, query: string): number | null {
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  return null;
}

function nameRank(name: string, query: string, cjk: boolean): number | null {
  const folded = fold(name);
  const compact = squeeze(name);
  const compactQuery = squeeze(query);
  if (folded === query || compact === compactQuery) return 0;
  const direct = cjk ? cjkRank(folded, query) : latinRank(folded, query);
  if (compactQuery === query) return direct;
  const compactRank = cjk ? cjkRank(compact, compactQuery) : latinRank(compact, compactQuery);
  if (compactRank == null) return direct;
  if (direct == null) return compactRank;
  return Math.min(direct, compactRank);
}

function numberKey(term: string) {
  const raw = term.toLowerCase().replace(/^#/, "");
  if (!/^\d{1,3}(?:\/\d{1,3})?$/.test(raw)) return null;
  return raw;
}

function sameNumber(cardNumber: string, token: string) {
  const full = cardNumber.toLowerCase();
  if (full === token) return true;
  const left = (value: string) => value.split("/")[0]?.replace(/^0+/, "") || "0";
  const right = (value: string) => value.split("/")[1]?.replace(/^0+/, "") || "";
  if (token.includes("/")) return left(full) === left(token) && right(full) === right(token);
  return left(full) === left(token);
}

function specificRank(card: CatalogCard, query: string) {
  const terms = query.split(/\s+/).filter(Boolean);
  const numbers = terms.map(numberKey).filter((token): token is string => token != null);
  if (numbers.length === 0) return null;
  if (!numbers.every((token) => sameNumber(card.number, token))) return null;
  const rest = terms.filter((term) => numberKey(term) == null);
  if (rest.length === 0) return 3;
  const code = fold(card.setCode ?? "");
  if (rest.length === 1 && code && fold(rest[0] ?? "") === code) return 0;
  const hay = fold(`${card.names.en} ${card.names.zh ?? ""} ${card.setName} ${code}`);
  if (rest.every((term) => hay.includes(fold(term)))) {
    return rest.some((term) => code && fold(term) === code) ? 0 : 1;
  }
  return null;
}

function cardRank(card: CatalogCard, query: string): number | null {
  const specific = specificRank(card, query);
  if (specific != null) return specific;
  if (query.split(/\s+/).some((term) => numberKey(term))) return null;
  const cjk = /[\u3400-\u9fff]/.test(query);
  const en = nameRank(card.names.en, query, cjk);
  const zh = card.names.zh ? nameRank(card.names.zh, query, cjk) : null;
  if (en != null || zh != null) {
    if (en == null) return zh;
    if (zh == null) return en;
    return Math.min(en, zh);
  }
  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    const nameHay = fold(`${card.names.en} ${card.names.zh ?? ""}`);
    if (terms.every((term) => nameHay.includes(term))) return 2;
    const hay = `${nameHay} ${fold(card.setName)} ${card.number.toLowerCase()}`;
    if (terms.every((term) => hay.includes(term))) return 4;
  }
  return null;
}

export function searchNamedCards<T extends CatalogCard>(cards: T[], query: string, lang: PrintLang = "en") {
  const q = fold(query.trim());
  if (q.length < 2 || /^[a-z]{1,2}$/.test(q)) return [];
  const hits: { card: T; rank: number }[] = [];
  for (const card of cards) {
    if (!matchesPrint(card.region, lang)) continue;
    const rank = cardRank(card, q);
    if (rank != null) hits.push({ card, rank });
  }
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.card.names.en.length - b.card.names.en.length ||
      a.card.names.en.localeCompare(b.card.names.en) ||
      a.card.setName.localeCompare(b.card.setName) ||
      a.card.number.localeCompare(b.card.number),
  );
  return hits.map((hit) => hit.card);
}

export function filterCards<T extends CatalogCard>(cards: T[], filter: string) {
  if (!FILTERS.includes(filter as (typeof FILTERS)[number])) return cards;
  if (filter === "Trainer") return cards.filter((card) => card.supertype === "Trainer");
  return cards.filter((card) => card.types.includes(filter));
}

export function shouldQueryLive(query: string, apiKey: string | undefined) {
  const q = query.trim();
  if (!apiKey || q.length < 2) return false;
  if (/[\u3400-\u9fff]/.test(q)) return false;
  return true;
}

export function validatePost(input: {
  author: string;
  side: string;
  description: string;
  contact: string;
  cardId: string;
}): ErrorCode | null {
  if (!NICK.test(input.author.trim())) return "nick";
  if (input.side !== "buy" && input.side !== "sell") return "side";
  if (!/^[A-Za-z0-9-]{1,40}$/.test(input.cardId)) return "card";
  const description = input.description.trim();
  if (description.length < 10 || description.length > 500) return "description";
  const contact = input.contact.trim();
  if (contact.length < 2 || contact.length > 80) return "contact";
  return null;
}

export function validateReply(input: { author: string; body: string }): ErrorCode | null {
  if (!NICK.test(input.author.trim())) return "nick";
  const body = input.body.trim();
  if (body.length < 1 || body.length > 400) return "body";
  return null;
}

export function formatWhen(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function pickText(field: { en: string; zh: string }, locale: string) {
  return locale === "zh" ? field.zh : field.en;
}
