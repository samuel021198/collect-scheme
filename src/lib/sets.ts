import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

type PrintLang = "en" | "ja";

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function squeeze(value: string) {
  return fold(value).replace(/[&＆\s]+/g, "");
}

function matchesPrint(region: string | undefined, lang: PrintLang) {
  const print = region === "jp" ? "jp" : "intl";
  return lang === "ja" ? print === "jp" : print === "intl";
}

export type TcgSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  code: string | null;
  region?: string;
  releaseDate: string | null;
  symbol: string;
  logo: string;
};

const SERIES_ORDER = [
  "Mega Evolution",
  "Scarlet & Violet",
  "Sword & Shield",
  "Sun & Moon",
  "XY",
  "Black & White",
  "HeartGold & SoulSilver",
  "Platinum",
  "Diamond & Pearl",
  "POP",
  "EX",
  "E-Card",
  "NP",
  "Neo",
  "Gym",
  "Base",
  "Other",
];

const SERIES_ZH: Record<string, string> = {
  "Mega Evolution": "超級進化",
  "Scarlet & Violet": "朱＆紫",
  "Sword & Shield": "劍＆盾",
  "Sun & Moon": "太陽＆月亮",
  "XY": "XY",
  "Black & White": "黑＆白",
  "HeartGold & SoulSilver": "心金＆靈魂銀",
  Platinum: "白金",
  "Diamond & Pearl": "鑽石＆珍珠",
  POP: "POP",
  EX: "EX",
  "E-Card": "e 卡",
  NP: "Nintendo Promos",
  Neo: "新世代",
  Gym: "道館",
  Base: "初代",
  Original: "初代",
  "e-Card": "e 卡",
  "Call of Legends": "傳說交鋒",
  "Legendary Collection": "傳說收藏",
  PCG: "PCG",
  ADV: "ADV",
  LEGEND: "LEGEND",
  VS: "VS",
  Web: "Web",
  "Movie Commemorations": "電影紀念",
  "Vending Machine": "販賣機",
  Other: "其他",
  "Trainer & Deck Kits": "訓練家與牌組",
  "Play! Pokémon": "Play! Pokémon",
  "World Championships Decks": "世錦賽牌組",
  "McDonald's": "麥當勞",
  "Unnumbered Energies": "無編號能量",
  Topps: "Topps",
};

let cache: { mtime: number; sets: TcgSet[] } | null = null;

export function loadSets() {
  const file = join(process.cwd(), "data/tcg/sets.json");
  try {
    const mtime = statSync(file).mtimeMs;
    if (cache?.mtime === mtime) return cache.sets;
    const sets = JSON.parse(readFileSync(file, "utf8")) as TcgSet[];
    cache = { mtime, sets };
    return sets;
  } catch {
    return [];
  }
}

export function getSet(id: string) {
  return loadSets().find((set) => set.id === id) ?? null;
}

export function seriesLabel(series: string, locale: string) {
  if (locale === "zh") return SERIES_ZH[series] ?? series;
  return series;
}

export function seriesAnchor(series: string) {
  return series
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fieldHit(field: string, query: string) {
  const folded = fold(field);
  const compact = squeeze(field);
  const compactQuery = squeeze(query);
  if (folded === query || compact === compactQuery) return "exact" as const;
  if (/[\u3400-\u9fff]/.test(query)) {
    if (folded.includes(query) || compact.includes(compactQuery)) return "includes" as const;
    return null;
  }
  const allowPrefix = query.length >= 4;
  let from = 0;
  while (from < folded.length) {
    const index = folded.indexOf(query, from);
    if (index < 0) break;
    const before = index === 0 ? "" : (folded[index - 1] ?? "");
    const after = folded[index + query.length] ?? "";
    const word = (char: string) => /[a-z0-9]/i.test(char);
    const beforeOk = index === 0 || !word(before);
    const afterOk = after === "" || !word(after);
    if (beforeOk && (afterOk || allowPrefix)) return "includes" as const;
    from = index + Math.max(query.length, 1);
  }
  return null;
}

function rankSet(set: TcgSet, query: string) {
  const code = fold(set.code ?? "");
  if (code && code === query) return 0;
  const hits = [set.name, set.series, seriesLabel(set.series, "zh")].map((field) => fieldHit(field, query));
  if (hits.includes("exact")) return 1;
  if (code && code.startsWith(query)) return 2;
  if (hits.includes("includes")) return 3;
  return null;
}

export function matchSets(sets: TcgSet[], query: string, lang: PrintLang) {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const hits: { set: TcgSet; rank: number }[] = [];
  for (const set of sets) {
    if (!matchesPrint(set.region, lang)) continue;
    const rank = rankSet(set, q);
    if (rank != null) hits.push({ set, rank });
  }
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      (b.set.releaseDate ?? "").localeCompare(a.set.releaseDate ?? "") ||
      a.set.name.localeCompare(b.set.name),
  );
  return hits.map((hit) => hit.set);
}

export function setsBrowseHref(lang: PrintLang, query = "") {
  const params = new URLSearchParams();
  if (lang === "ja") params.set("lang", "ja");
  const q = query.trim();
  if (q) params.set("q", q);
  const search = params.toString();
  return search ? `/sets?${search}` : "/sets";
}

export function groupSets(sets: TcgSet[], query: string) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? sets.filter((set) =>
        [set.name, set.series, seriesLabel(set.series, "zh"), set.code ?? "", set.id].some((value) =>
          value.toLowerCase().includes(q),
        ),
      )
    : sets;

  const buckets = new Map<string, TcgSet[]>();
  for (const set of filtered) {
    const list = buckets.get(set.series) ?? [];
    list.push(set);
    buckets.set(set.series, list);
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "") || a.name.localeCompare(b.name));
  }

  const known = SERIES_ORDER.filter((series) => buckets.has(series));
  const rest = [...buckets.keys()].filter((series) => !SERIES_ORDER.includes(series));
  rest.sort((a, b) => (buckets.get(b)?.[0]?.releaseDate ?? "").localeCompare(buckets.get(a)?.[0]?.releaseDate ?? ""));

  return [...known, ...rest].map((series) => ({ series, sets: buckets.get(series)! }));
}

export function formatRelease(date: string | null, locale: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
