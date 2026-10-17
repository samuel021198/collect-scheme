export function mixByLanguage<T extends { id: string }>(english: T[], japanese: T[], limit: number) {
  const out: T[] = [];
  const seen = new Set<string>();
  const rows = Math.max(english.length, japanese.length);
  for (let index = 0; index < rows && out.length < limit; index += 1) {
    for (const list of [english, japanese]) {
      const item = list[index];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= limit) break;
    }
  }
  return out;
}

const RARITY_SCORE: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  "Rare Holo": 4,
  "Double Rare": 5,
  "Ultra Rare": 6,
  "Super Rare": 6,
  "Illustration Rare": 7,
  "Art Rare": 7,
  "Special Illustration Rare": 8,
  "Special Art Rare": 8,
  "Hyper Rare": 8,
};

function pokemonRank(supertype: string | undefined) {
  return supertype === "Pokémon" || supertype === "Pokemon" ? 0 : 1;
}

function collectorNumber(number: string) {
  const parsed = Number((number.split("/")[0] ?? "").replace(/^0+/, "") || "0");
  return Number.isFinite(parsed) ? parsed : 9999;
}

export function previewSetCards<
  T extends { id: string; region?: string; rarity: string; number: string; supertype?: string },
>(cards: T[], limit: number) {
  const unique: T[] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    unique.push(card);
  }
  const compare = (a: T, b: T) =>
    pokemonRank(a.supertype) - pokemonRank(b.supertype) ||
    (RARITY_SCORE[b.rarity] ?? 0) - (RARITY_SCORE[a.rarity] ?? 0) ||
    collectorNumber(a.number) - collectorNumber(b.number) ||
    a.id.localeCompare(b.id);
  return mixByLanguage(
    unique.filter((card) => card.region !== "jp").sort(compare),
    unique.filter((card) => card.region === "jp").sort(compare),
    limit,
  );
}

export function pickSuggestedCards<T>(named: T[], fromSets: T[], query: string) {
  const digits = /^\d{2,4}$/.test(query.trim());
  if (fromSets.length > 0 && (named.length === 0 || digits)) return fromSets;
  return named;
}
