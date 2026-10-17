import assert from "node:assert/strict";
import test from "node:test";
import { groupSets, matchSets, seriesAnchor, seriesLabel, type TcgSet } from "./sets.ts";

const sets: TcgSet[] = [
  {
    id: "base1",
    name: "Base",
    series: "Base",
    printedTotal: 102,
    total: 102,
    code: "BS",
    releaseDate: "1999-01-09",
    symbol: "",
    logo: "",
  },
  {
    id: "sv1",
    name: "Scarlet & Violet",
    series: "Scarlet & Violet",
    printedTotal: 198,
    total: 258,
    code: "SVI",
    releaseDate: "2023-03-31",
    symbol: "",
    logo: "",
  },
  {
    id: "sv3pt5",
    name: "151",
    series: "Scarlet & Violet",
    printedTotal: 165,
    total: 207,
    code: "MEW",
    releaseDate: "2023-09-22",
    symbol: "",
    logo: "",
  },
  {
    id: "11575",
    name: "Pokémon Card 151",
    series: "Scarlet & Violet",
    printedTotal: 165,
    total: 210,
    code: "SV2a",
    region: "jp",
    releaseDate: "2023-06-16",
    symbol: "",
    logo: "",
  },
  {
    id: "mewtwo-deck",
    name: "Battle Academy (Mewtwo)",
    series: "Base",
    printedTotal: 1,
    total: 1,
    code: null,
    region: "intl",
    releaseDate: "2020-01-01",
    symbol: "",
    logo: "",
  },
];

test("sets group newest era first and newest set first", () => {
  const groups = groupSets(sets, "");
  assert.deepEqual(
    groups.map((group) => group.series),
    ["Scarlet & Violet", "Base"],
  );
  assert.equal(groups[0]?.sets[0]?.id, "sv3pt5");
});

test("set search matches the code and the Chinese era name", () => {
  const names = groupSets(sets, "mew").flatMap((group) => group.sets.map((set) => set.name));
  assert.ok(names.includes("151"));
  assert.equal(groupSets(sets, "朱")[0]?.series, "Scarlet & Violet");
});

test("set search ranks the code inside one language", () => {
  assert.equal(matchSets(sets, "SV2A", "ja")[0]?.id, "11575");
  assert.equal(matchSets(sets, "SV2A", "en").length, 0);
  assert.deepEqual(
    matchSets(sets, "MEW", "en").map((set) => set.id),
    ["sv3pt5"],
  );
  assert.equal(matchSets(sets, "", "en").length, 0);
  assert.deepEqual(
    matchSets(sets, "朱紫", "en").map((set) => set.id),
    ["sv3pt5", "sv1"],
  );
  assert.deepEqual(
    matchSets(sets, "朱紫", "ja").map((set) => set.id),
    ["11575"],
  );
});

test("series labels and anchors stay stable", () => {
  assert.equal(seriesLabel("Scarlet & Violet", "zh"), "朱＆紫");
  assert.equal(seriesLabel("Scarlet & Violet", "en"), "Scarlet & Violet");
  assert.equal(seriesAnchor("Sword & Shield"), "sword-and-shield");
});
