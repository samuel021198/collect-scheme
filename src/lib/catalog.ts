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

export function searchCards<T extends CatalogCard>(cards: T[], query: string) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return cards;
  return cards.filter((card) => {
    const hay = [
      card.names.en,
      card.names.zh ?? "",
      card.setName,
      card.setId,
      card.setCode ?? "",
      card.number,
      card.rarity,
      card.supertype,
      card.id,
      ...card.types,
      ...card.subtypes,
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
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
