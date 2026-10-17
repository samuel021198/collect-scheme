export type FinishTone =
  | "plain"
  | "holo"
  | "reverse"
  | "ultra"
  | "illustration"
  | "special"
  | "gold"
  | "shiny"
  | "promo";

export type Finish = {
  id: string;
  mark: string;
  en: string;
  zh: string;
  tone: FinishTone;
};

const REVERSE: Finish = {
  id: "reverse",
  mark: "RH",
  en: "Reverse Holo",
  zh: "反向閃",
  tone: "reverse",
};

const FINISHES: Record<string, Finish> = {
  Common: { id: "common", mark: "C", en: "Common", zh: "普通", tone: "plain" },
  Uncommon: { id: "uncommon", mark: "U", en: "Uncommon", zh: "非普通", tone: "plain" },
  Rare: { id: "rare", mark: "R", en: "Rare", zh: "稀有", tone: "plain" },
  "Rare Holo": { id: "holo", mark: "H", en: "Holo", zh: "閃卡", tone: "holo" },
  "Double Rare": { id: "double", mark: "RR", en: "Double Rare", zh: "雙稀有", tone: "holo" },
  "Triple Rare": { id: "triple", mark: "RRR", en: "Triple Rare", zh: "三稀有", tone: "ultra" },
  "Ultra Rare": { id: "ultra", mark: "UR", en: "Ultra Rare", zh: "超稀有", tone: "ultra" },
  "Rare Ultra": { id: "ultra", mark: "UR", en: "Ultra Rare", zh: "超稀有", tone: "ultra" },
  "Illustration Rare": { id: "illustration", mark: "IR", en: "Illustration Rare", zh: "插畫稀有", tone: "illustration" },
  "Special Illustration Rare": {
    id: "special-illustration",
    mark: "SIR",
    en: "Special Illustration Rare",
    zh: "特別插畫稀有",
    tone: "special",
  },
  "Hyper Rare": { id: "hyper", mark: "HR", en: "Hyper Rare", zh: "極稀有", tone: "gold" },
  "Art Rare": { id: "art", mark: "AR", en: "Art Rare", zh: "藝術稀有", tone: "illustration" },
  "Special Art Rare": { id: "special-art", mark: "SAR", en: "Special Art Rare", zh: "特別藝術稀有", tone: "special" },
  "Super Rare": { id: "super", mark: "SR", en: "Super Rare", zh: "超級稀有", tone: "ultra" },
  "Character Rare": { id: "character", mark: "CHR", en: "Character Rare", zh: "角色稀有", tone: "illustration" },
  "Character Super Rare": {
    id: "character-super",
    mark: "CSR",
    en: "Character Super Rare",
    zh: "角色超級稀有",
    tone: "special",
  },
  "Rare Holo ex": { id: "ex", mark: "ex", en: "Holo ex", zh: "閃卡 ex", tone: "holo" },
  "Rare Holo EX": { id: "ex", mark: "EX", en: "Holo EX", zh: "閃卡 EX", tone: "holo" },
  "Rare Holo GX": { id: "gx", mark: "GX", en: "Holo GX", zh: "閃卡 GX", tone: "holo" },
  "Holo Rare V": { id: "v", mark: "V", en: "Holo V", zh: "閃卡 V", tone: "holo" },
  "Holo Rare VMAX": { id: "vmax", mark: "VMAX", en: "Holo VMAX", zh: "閃卡 VMAX", tone: "ultra" },
  "Holo Rare VSTAR": { id: "vstar", mark: "VSTAR", en: "Holo VSTAR", zh: "閃卡 VSTAR", tone: "ultra" },
  "Rare Holo LV.X": { id: "lvx", mark: "LV.X", en: "Holo LV.X", zh: "閃卡 LV.X", tone: "holo" },
  "ACE SPEC Rare": { id: "ace", mark: "ACE", en: "ACE SPEC", zh: "ACE SPEC", tone: "ultra" },
  "Rare ACE": { id: "ace", mark: "ACE", en: "ACE SPEC", zh: "ACE SPEC", tone: "ultra" },
  "Radiant Rare": { id: "radiant", mark: "RAD", en: "Radiant Rare", zh: "光輝稀有", tone: "shiny" },
  "Rare Secret": { id: "secret", mark: "SEC", en: "Secret Rare", zh: "秘密稀有", tone: "gold" },
  "Rare Rainbow": { id: "rainbow", mark: "RB", en: "Rainbow Rare", zh: "彩虹稀有", tone: "special" },
  "Rare Shiny": { id: "shiny", mark: "S", en: "Shiny", zh: "色違", tone: "shiny" },
  "Rare Shiny GX": { id: "shiny", mark: "S", en: "Shiny GX", zh: "色違 GX", tone: "shiny" },
  Shiny: { id: "shiny", mark: "S", en: "Shiny", zh: "色違", tone: "shiny" },
  "Shiny Rare": { id: "shiny", mark: "S", en: "Shiny Rare", zh: "色違稀有", tone: "shiny" },
  "Shiny Rare V": { id: "shiny", mark: "S", en: "Shiny V", zh: "色違 V", tone: "shiny" },
  "Shiny Rare VMAX": { id: "shiny", mark: "S", en: "Shiny VMAX", zh: "色違 VMAX", tone: "shiny" },
  "Shiny Super Rare": { id: "shiny", mark: "S", en: "Shiny Super Rare", zh: "色違超級稀有", tone: "shiny" },
  "Shiny Ultra Rare": { id: "shiny", mark: "S", en: "Shiny Ultra Rare", zh: "色違超稀有", tone: "shiny" },
  "Rare Shining": { id: "shiny", mark: "S", en: "Shining", zh: "閃耀", tone: "shiny" },
  Promo: { id: "promo", mark: "PROMO", en: "Promo", zh: "促銷", tone: "promo" },
  "Rare Prime": { id: "prime", mark: "PRIME", en: "Prime", zh: "Prime", tone: "ultra" },
  "Rare BREAK": { id: "break", mark: "BREAK", en: "BREAK", zh: "BREAK", tone: "ultra" },
  "Prism Rare": { id: "prism", mark: "PR", en: "Prism Rare", zh: "稜鏡稀有", tone: "special" },
  "Rare Prism Star": { id: "prism", mark: "◇", en: "Prism Star", zh: "稜鏡之星", tone: "special" },
  "Amazing Rare": { id: "amazing", mark: "A", en: "Amazing Rare", zh: "驚艷稀有", tone: "special" },
  "Classic Collection": { id: "classic", mark: "CC", en: "Classic Collection", zh: "經典收藏", tone: "holo" },
  LEGEND: { id: "legend", mark: "LEGEND", en: "LEGEND", zh: "傳說", tone: "gold" },
  "Rare Holo ☆": { id: "star", mark: "☆", en: "Holo Star", zh: "閃卡星", tone: "gold" },
  "Mega Attack Rare": { id: "mega", mark: "MA", en: "Mega Attack Rare", zh: "超級進化攻擊", tone: "ultra" },
  "Mega Hyper Rare": { id: "mega", mark: "MHR", en: "Mega Hyper Rare", zh: "超級進化極稀有", tone: "gold" },
  "Mega Ultra Rare": { id: "mega", mark: "MUR", en: "Mega Ultra Rare", zh: "超級進化超稀有", tone: "ultra" },
  "Pikachu Rare": { id: "rare", mark: "R", en: "Pikachu Rare", zh: "皮卡丘稀有", tone: "plain" },
  "Black White Rare": { id: "rare", mark: "R", en: "Black & White Rare", zh: "黑白稀有", tone: "plain" },
  "RGB Rare": { id: "rare", mark: "R", en: "RGB Rare", zh: "RGB 稀有", tone: "plain" },
  "Futuristic Rare": { id: "rare", mark: "R", en: "Futuristic Rare", zh: "未來稀有", tone: "plain" },
  "Trainer Rare": { id: "rare", mark: "R", en: "Trainer Rare", zh: "訓練家稀有", tone: "illustration" },
};

const PARALLEL = new Set(["common", "uncommon", "rare", "holo"]);

const REVERSE_SERIES = new Set([
  "e-Card",
  "EX",
  "ADV",
  "PCG",
  "Diamond & Pearl",
  "Platinum",
  "LEGEND",
  "HeartGold & SoulSilver",
  "Call of Legends",
  "Black & White",
  "XY",
  "Sun & Moon",
  "Sword & Shield",
  "Scarlet & Violet",
  "Mega Evolution",
]);

export function finishForRarity(rarity: string): Finish | null {
  const named = FINISHES[rarity];
  if (named) return named;
  if (!rarity || rarity === "Unknown") return null;
  return { id: "other", mark: rarity.slice(0, 4), en: rarity, zh: rarity, tone: "plain" };
}

export function cardFinishes(card: { rarity: string; series?: string | null }): Finish[] {
  const primary = finishForRarity(card.rarity);
  if (!primary) return [];
  if (card.series === "Legendary Collection" && PARALLEL.has(primary.id)) {
    return primary.id === "holo" ? [REVERSE, primary] : [REVERSE];
  }
  if (REVERSE_SERIES.has(card.series ?? "") && PARALLEL.has(primary.id)) return [primary, REVERSE];
  return [primary];
}

export function finishLabel(finish: Finish, locale: string) {
  return locale === "zh" ? finish.zh : finish.en;
}
