import assert from "node:assert/strict";
import test from "node:test";
import { rankSearches } from "./search-rank.ts";
import { mixByLanguage, pickSuggestedCards, previewSetCards } from "./suggest.ts";

const day = 24 * 60 * 60 * 1000;

test("recent searches count both prints and drop anything older than two weeks", () => {
  const now = Date.UTC(2026, 9, 17);
  assert.deepEqual(
    rankSearches(
      [
        { id: "en-charizard", at: now - day },
        { id: "en-charizard", at: now - 2 * day },
        { id: "jp-charizard", at: now - day },
        { id: "old", at: now - 15 * day },
      ],
      now,
    ),
    ["en-charizard", "jp-charizard"],
  );
});

test("a set code previews cards from that set, while a name keeps name matches", () => {
  const named = [{ id: "charizard" }];
  const fromSets = [{ id: "set-card" }];
  assert.deepEqual(pickSuggestedCards(named, fromSets, "噴火龍"), named);
  assert.deepEqual(pickSuggestedCards([], fromSets, "SV2a"), fromSets);
  assert.deepEqual(pickSuggestedCards(named, fromSets, "151"), fromSets);
});

test("set previews alternate languages and put the rarer card first", () => {
  assert.deepEqual(
    previewSetCards(
      [
        { id: "en-common", region: "intl", rarity: "Common", number: "001/165", supertype: "Pokémon" },
        { id: "en-energy", region: "intl", rarity: "Hyper Rare", number: "207/165", supertype: "Energy" },
        { id: "en-sir", region: "intl", rarity: "Special Illustration Rare", number: "199/165", supertype: "Pokémon" },
        { id: "jp-sar", region: "jp", rarity: "Special Art Rare", number: "201/165", supertype: "Pokémon" },
      ],
      3,
    ).map((card) => card.id),
    ["en-sir", "jp-sar", "en-common"],
  );
});

test("suggestions alternate English and Japanese matches", () => {
  assert.deepEqual(
    mixByLanguage(
      [
        { id: "en-1" },
        { id: "en-2" },
      ],
      [{ id: "jp-1" }],
      3,
    ).map((item) => item.id),
    ["en-1", "jp-1", "en-2"],
  );
});
