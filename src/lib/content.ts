import rawCards from "../../data/cards.json";
import zhNames from "../../data/names/zh.json";
import rawShops from "../../data/shops.json";
import { searchCards, shouldQueryLive } from "./catalog";
import type { CatalogCard, Shop } from "./types";

type RawCard = Omit<CatalogCard, "names"> & { nameEn: string };

const namesZh = zhNames as Record<string, string>;

function attachNames(raw: RawCard): CatalogCard {
  const zh = namesZh[raw.id];
  return {
    id: raw.id,
    names: zh ? { en: raw.nameEn, zh } : { en: raw.nameEn },
    supertype: raw.supertype,
    subtypes: raw.subtypes,
    hp: raw.hp,
    types: raw.types,
    setId: raw.setId,
    setName: raw.setName,
    number: raw.number,
    rarity: raw.rarity,
    imageSmall: raw.imageSmall,
    imageLarge: raw.imageLarge,
  };
}

let seedCache: CatalogCard[] | null = null;

export function loadCards() {
  if (!seedCache) seedCache = (rawCards as RawCard[]).map(attachNames);
  return seedCache;
}

export function loadShops() {
  return rawShops as Shop[];
}

export function hasApiKey() {
  return Boolean(process.env.POKEMONTCG_API_KEY);
}

function mapApiCard(raw: {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  set: { id: string; name: string };
  number: string;
  rarity?: string;
  images: { small: string; large: string };
}): CatalogCard {
  return attachNames({
    id: raw.id,
    nameEn: raw.name,
    supertype: raw.supertype,
    subtypes: raw.subtypes ?? [],
    hp: raw.hp ?? null,
    types: raw.types ?? [],
    setId: raw.set.id,
    setName: raw.set.name,
    number: raw.number,
    rarity: raw.rarity ?? "Unknown",
    imageSmall: raw.images.small,
    imageLarge: raw.images.large,
  });
}

async function fetchLive(query: string, apiKey: string) {
  const tokens = query
    .replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  if (tokens.length === 0) return [];
  const url = new URL("https://api.pokemontcg.io/v2/cards");
  url.searchParams.set("q", tokens.map((token) => `name:${token}*`).join(" "));
  url.searchParams.set("pageSize", "12");
  url.searchParams.set("orderBy", "-set.releaseDate");
  url.searchParams.set(
    "select",
    "id,name,supertype,subtypes,hp,types,set,number,rarity,images",
  );
  const response = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    signal: AbortSignal.timeout(4000),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Pokémon TCG API ${response.status}`);
  const payload = (await response.json()) as { data?: Parameters<typeof mapApiCard>[0][] };
  return (payload.data ?? []).map(mapApiCard);
}

export type SearchMode = "browse" | "seed" | "live" | "cjk" | "fallback";

export async function searchCatalog(query: string): Promise<{ cards: CatalogCard[]; mode: SearchMode }> {
  const seed = loadCards();
  const q = query.trim();
  if (!q) return { cards: seed, mode: "browse" };

  const local = searchCards(seed, q);

  const key = process.env.POKEMONTCG_API_KEY;
  if (/[\u3400-\u9fff]/.test(q)) return { cards: local, mode: "cjk" };
  if (!shouldQueryLive(q, key)) return { cards: local, mode: "seed" };

  try {
    const live = await fetchLive(q, key!);
    const seen = new Set(live.map((card) => card.id));
    const merged = [...live, ...local.filter((card) => !seen.has(card.id))].slice(0, 36);
    return { cards: merged, mode: "live" };
  } catch {
    return { cards: local, mode: "fallback" };
  }
}

export async function getCard(id: string): Promise<CatalogCard | null> {
  if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) return null;
  const seeded = loadCards().find((card) => card.id === id);
  if (seeded) return seeded;
  const key = process.env.POKEMONTCG_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${id}`, {
      headers: { "X-Api-Key": key },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: Parameters<typeof mapApiCard>[0] };
    return payload.data ? mapApiCard(payload.data) : null;
  } catch {
    return null;
  }
}
