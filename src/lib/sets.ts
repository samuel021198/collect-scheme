import { readFileSync } from "node:fs";
import { join } from "node:path";

export type TcgSet = {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  code: string | null;
  releaseDate: string;
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
  Other: "其他",
};

let cache: TcgSet[] | null = null;

export function loadSets() {
  if (!cache) {
    cache = JSON.parse(readFileSync(join(process.cwd(), "data/sets.json"), "utf8")) as TcgSet[];
  }
  return cache;
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
    list.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name));
  }

  const known = SERIES_ORDER.filter((series) => buckets.has(series));
  const rest = [...buckets.keys()].filter((series) => !SERIES_ORDER.includes(series));
  rest.sort((a, b) => (buckets.get(b)![0]?.releaseDate ?? "").localeCompare(buckets.get(a)![0]?.releaseDate ?? ""));

  return [...known, ...rest].map((series) => ({ series, sets: buckets.get(series)! }));
}

export function formatRelease(date: string, locale: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
