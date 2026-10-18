import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import rawShops from "../../data/shops.json";
import { searchNamedCards, type PrintLang } from "./catalog";
import type { CardPrint } from "./finishes";
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

type Trait = { types?: string[]; category?: string };

let cardCache: Cache<CatalogCard[]> | null = null;
let cardsById = new Map<string, CatalogCard>();
let printCache: Cache<Record<string, CardPrint[]>> | null = null;
let traitCache: Cache<Record<string, Trait>> | null = null;

function cardsFile() {
  return join(process.cwd(), "data/tcg/cards.json");
}

function loadPrints() {
  const file = join(process.cwd(), "data/tcg/variants.json");
  if (!existsSync(file)) return {};
  const mtime = statSync(file).mtimeMs;
  if (printCache?.mtime === mtime) return printCache.value;
  const value = JSON.parse(readFileSync(file, "utf8")) as Record<string, CardPrint[]>;
  printCache = { mtime, value };
  return value;
}

function loadTraits() {
  const file = join(process.cwd(), "data/tcg/traits.json");
  if (!existsSync(file)) return {};
  const mtime = statSync(file).mtimeMs;
  if (traitCache?.mtime === mtime) return traitCache.value;
  const value = JSON.parse(readFileSync(file, "utf8")) as Record<string, Trait>;
  traitCache = { mtime, value };
  return value;
}

function supertypeOf(category: string | undefined) {
  if (category === "Trainer") return "Trainer";
  if (category === "Energy") return "Energy";
  if (category === "Pokemon" || category === "Pokémon") return "Pokémon";
  return "";
}

function toCard(raw: StoredCard, prints: CardPrint[] | undefined, trait: Trait | undefined): CatalogCard {
  return {
    id: raw.id,
    names: raw.zh ? { en: raw.name, zh: raw.zh } : { en: raw.name },
    supertype: supertypeOf(trait?.category),
    subtypes: [],
    hp: null,
    types: trait?.types ?? [],
    setId: raw.setId,
    setName: raw.setName,
    setCode: raw.setCode,
    series: raw.series,
    region: raw.region === "jp" ? "jp" : "intl",
    number: raw.number,
    rarity: raw.rarity,
    imageSmall: raw.image,
    imageLarge: raw.image,
    prints: prints && prints.length > 0 ? prints : undefined,
  };
}

export function loadCards() {
  const file = cardsFile();
  if (!existsSync(file)) return [];
  const traitFile = join(process.cwd(), "data/tcg/traits.json");
  const printFile = join(process.cwd(), "data/tcg/variants.json");
  const mtime =
    statSync(file).mtimeMs +
    (existsSync(traitFile) ? statSync(traitFile).mtimeMs : 0) +
    (existsSync(printFile) ? statSync(printFile).mtimeMs : 0);
  if (cardCache?.mtime === mtime) return cardCache.value;
  const prints = loadPrints();
  const traits = loadTraits();
  const cards = (JSON.parse(readFileSync(file, "utf8")) as StoredCard[]).map((raw) =>
    toCard(raw, prints[raw.id], traits[raw.id]),
  );
  cardCache = { mtime, value: cards };
  cardsById = new Map(cards.map((card) => [card.id, card]));
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
  if (cardsById.size === 0) loadCards();
  return cardsById.get(id) ?? null;
}
