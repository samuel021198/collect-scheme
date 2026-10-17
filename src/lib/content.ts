import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import rawShops from "../../data/shops.json";
import { searchNamedCards, type PrintLang } from "./catalog";
import type { CatalogCard, Shop } from "./types";

type StoredCard = {
  id: string;
  name: string;
  zh?: string;
  number: string;
  rarity: string;
  image: string;
  setId: string;
  setName: string;
  setCode: string | null;
  series: string;
  region: string;
};

type Cache<T> = { mtime: number; value: T };

let cardCache: Cache<CatalogCard[]> | null = null;

function cardsFile() {
  return join(process.cwd(), "data/tcg/cards.json");
}

function toCard(raw: StoredCard): CatalogCard {
  return {
    id: raw.id,
    names: raw.zh ? { en: raw.name, zh: raw.zh } : { en: raw.name },
    supertype: "",
    subtypes: [],
    hp: null,
    types: [],
    setId: raw.setId,
    setName: raw.setName,
    setCode: raw.setCode,
    region: raw.region === "jp" ? "jp" : "intl",
    number: raw.number,
    rarity: raw.rarity,
    imageSmall: raw.image,
    imageLarge: raw.image,
  };
}

export function loadCards() {
  const file = cardsFile();
  if (!existsSync(file)) return [];
  const mtime = statSync(file).mtimeMs;
  if (cardCache?.mtime === mtime) return cardCache.value;
  const cards = (JSON.parse(readFileSync(file, "utf8")) as StoredCard[]).map(toCard);
  cardCache = { mtime, value: cards };
  return cards;
}

export function loadShops() {
  return rawShops as Shop[];
}

export function queryCards(query: string, lang: PrintLang = "en") {
  return searchNamedCards(loadCards(), query, lang);
}

export function cardsInSet(setId: string) {
  return loadCards().filter((card) => card.setId === setId);
}

export async function getCard(id: string): Promise<CatalogCard | null> {
  if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) return null;
  return loadCards().find((card) => card.id === id) ?? null;
}
