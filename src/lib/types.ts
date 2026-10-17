import type { CardPrint } from "./finishes";

export type CardNames = {
  en: string;
  zh?: string;
  // ja?: string;
  // "zh-Hans"?: string;
};

export type CatalogCard = {
  id: string;
  names: CardNames;
  supertype: string;
  subtypes: string[];
  hp: string | null;
  types: string[];
  setId: string;
  setName: string;
  setCode?: string | null;
  series?: string;
  region?: "intl" | "jp";
  number: string;
  rarity: string;
  imageSmall: string;
  imageLarge: string;
  prints?: CardPrint[];
};

export type CardSnap = {
  id: string;
  names: CardNames;
  imageSmall: string;
  setName: string;
  number: string;
  rarity: string;
};

export type Reply = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type TradePost = {
  id: string;
  side: "buy" | "sell";
  card: CardSnap;
  description: string;
  contact: string;
  author: string;
  createdAt: string;
  replies: Reply[];
};

export type Shop = {
  id: string;
  name: string;
  district: { en: string; zh: string };
  address: { en: string; zh: string };
  hours: { en: string; zh: string };
  blurb: { en: string; zh: string };
  mapsUrl: string;
  website: string;
};

export type ErrorCode =
  | "nick"
  | "side"
  | "card"
  | "description"
  | "contact"
  | "body"
  | "not_found"
  | "full"
  | "generic";
