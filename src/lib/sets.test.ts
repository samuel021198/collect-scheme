import assert from "node:assert/strict";
import test from "node:test";
import { groupSets, seriesAnchor, seriesLabel, type TcgSet } from "./sets.ts";

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
  const groups = groupSets(sets, "mew");
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.sets[0]?.name, "151");
  assert.equal(groupSets(sets, "朱")[0]?.series, "Scarlet & Violet");
});

test("series labels and anchors stay stable", () => {
  assert.equal(seriesLabel("Scarlet & Violet", "zh"), "朱＆紫");
  assert.equal(seriesLabel("Scarlet & Violet", "en"), "Scarlet & Violet");
  assert.equal(seriesAnchor("Sword & Shield"), "sword-and-shield");
});
