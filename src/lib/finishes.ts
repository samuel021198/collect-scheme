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

export type CardPrint = {
  t: string;
  f?: string;
  s?: string[];
  u?: string;
  z?: string;
};

const FOIL: Record<string, { en: string; zh: string; mark: string }> = {
  cosmos: { en: "Cosmos", zh: "宇宙", mark: "COS" },
  pokeball: { en: "Poké Ball", zh: "精靈球", mark: "PB" },
  masterball: { en: "Master Ball", zh: "大師球", mark: "MB" },
  greatball: { en: "Great Ball", zh: "超級球", mark: "GB" },
  ultraball: { en: "Ultra Ball", zh: "高級球", mark: "UB" },
  "cracked-ice": { en: "Cracked Ice", zh: "碎冰", mark: "ICE" },
  starlight: { en: "Starlight", zh: "星光", mark: "SL" },
  galaxy: { en: "Galaxy", zh: "銀河", mark: "GX" },
  energy: { en: "Energy", zh: "能量", mark: "EN" },
  mirror: { en: "Mirror", zh: "鏡面", mark: "MR" },
  tinsel: { en: "Tinsel", zh: "金蔥", mark: "TN" },
  gold: { en: "Gold", zh: "金", mark: "G" },
  league: { en: "League", zh: "聯盟", mark: "LG" },
  rainbow: { en: "Rainbow", zh: "彩虹", mark: "RB" },
  glitter: { en: "Glitter", zh: "閃粉", mark: "GL" },
};

const STAMP: Record<string, { en: string; zh: string; mark: string }> = {
  "1st-edition": { en: "1st Edition", zh: "初版", mark: "1st" },
  gamestop: { en: "GameStop Stamp", zh: "GameStop 印章", mark: "GS" },
  "eb-games": { en: "EB Games Stamp", zh: "EB Games 印章", mark: "EB" },
  "pokemon-center": { en: "Pokémon Center Stamp", zh: "寶可夢中心印章", mark: "PC" },
  "pre-release": { en: "Prerelease Stamp", zh: "預發售印章", mark: "PRE" },
  staff: { en: "Staff Stamp", zh: "工作人員印章", mark: "STAFF" },
  "professor-program": { en: "Professor Program Stamp", zh: "教授計劃印章", mark: "PROF" },
  "pokemon-together": { en: "Pokémon Together Stamp", zh: "Pokémon Together 印章", mark: "PT" },
  "w-promo": { en: "W Promo", zh: "W 促銷章", mark: "W" },
};

export function finishForRarity(rarity: string): Finish | null {
  const named = FINISHES[rarity];
  if (named) return named;
  if (!rarity || rarity === "Unknown") return null;
  return { id: "other", mark: rarity.slice(0, 4), en: rarity, zh: rarity, tone: "plain" };
}

function titled(value: string) {
  return value
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function stampCopy(stamp: string, setName: string) {
  if (stamp === "set-logo") {
    const name = setName || "Set";
    return { en: `${name} Stamp`, zh: `${name} 印章`, mark: "ST" };
  }
  return STAMP[stamp] ?? { en: `${titled(stamp)} Stamp`, zh: `${titled(stamp)} 印章`, mark: stamp.slice(0, 3).toUpperCase() };
}

function expectedType(rarity: string) {
  const primary = finishForRarity(rarity);
  if (!primary) return "normal";
  return primary.tone === "plain" ? "normal" : "holo";
}

function isMainPrint(rarity: string, print: CardPrint) {
  if (print.f || print.z === "jumbo" || (print.s && print.s.length > 0)) return false;
  if (print.u && print.u !== "unlimited") return false;
  return print.t === expectedType(rarity);
}

function printCopy(print: CardPrint, setName: string): { en: string; zh: string; mark: string; tone: FinishTone } {
  if (print.u === "shadowless" && print.s?.includes("1st-edition")) {
    return { en: "1st Edition", zh: "初版", mark: "1st", tone: "holo" };
  }
  if (print.u === "shadowless") return { en: "Shadowless", zh: "無陰影", mark: "SH", tone: "holo" };
  if (print.u === "1999-2000-copyright") return { en: "1999–2000", zh: "1999–2000", mark: "©", tone: "holo" };

  const stamps = (print.s ?? []).map((stamp) => stampCopy(stamp, setName));
  const foil = print.f ? (FOIL[print.f] ?? { en: titled(print.f), zh: titled(print.f), mark: print.f.slice(0, 3).toUpperCase() }) : null;
  const stampEn = stamps.map((stamp) => stamp.en).join(" · ");
  const stampZh = stamps.map((stamp) => stamp.zh).join(" · ");

  if (stampEn && !foil) {
    return { en: stampEn, zh: stampZh, mark: stamps[0]?.mark ?? "ST", tone: "promo" };
  }

  let en = "Non-holo";
  let zh = "非閃";
  let mark = "N";
  let tone: FinishTone = "plain";
  if (foil && print.t === "reverse") {
    en = `${foil.en} Reverse Holo`;
    zh = `${foil.zh}反向閃`;
    mark = foil.mark === "COS" ? "CRH" : foil.mark;
    tone = "reverse";
  } else if (foil && print.t === "holo") {
    en = `${foil.en} Holo`;
    zh = `${foil.zh}閃`;
    mark = foil.mark === "COS" ? "CH" : foil.mark;
    tone = "holo";
  } else if (print.t === "reverse") {
    en = "Reverse Holo";
    zh = "反向閃";
    mark = "RH";
    tone = "reverse";
  } else if (print.t === "holo") {
    en = "Holo";
    zh = "閃卡";
    mark = "H";
    tone = "holo";
  }
  if (print.z === "jumbo") {
    en = `${en} Jumbo`;
    zh = `${zh}大卡`;
  }
  if (stampEn) {
    en = `${en} · ${stampEn}`;
    zh = `${zh} · ${stampZh}`;
    mark = stamps[0]?.mark ?? mark;
    tone = "promo";
  }
  return { en, zh, mark, tone };
}

function printId(print: CardPrint, main: boolean, rarity: string) {
  if (main) return finishForRarity(rarity)?.id ?? print.t;
  const parts = [print.t];
  if (print.f) parts.push(print.f);
  if (print.u && print.u !== "unlimited") parts.push(print.u);
  if (print.s?.length) parts.push(...print.s);
  if (print.z === "jumbo") parts.push("jumbo");
  return parts.join("-");
}

export function cardFinishes(card: { rarity: string; setName?: string | null; prints?: CardPrint[] | null }): Finish[] {
  const prints = card.prints?.filter((print) => print.t) ?? [];
  if (prints.length === 0) {
    const primary = finishForRarity(card.rarity);
    return primary ? [primary] : [];
  }
  const setName = card.setName ?? "";
  const used = new Set<string>();
  return prints.map((print) => {
    const main = isMainPrint(card.rarity, print);
    const primary = main ? finishForRarity(card.rarity) : null;
    const copy = primary ?? printCopy(print, setName);
    let id = printId(print, Boolean(primary), card.rarity);
    while (used.has(id)) id = `${id}-2`;
    used.add(id);
    return { id, mark: copy.mark, en: copy.en, zh: copy.zh, tone: copy.tone };
  });
}

export function finishLabel(finish: Finish, locale: string) {
  return locale === "zh" ? finish.zh : finish.en;
}
