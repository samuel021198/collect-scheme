import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { parseCards, parseSets } from "./tcgcollector-parse.mjs";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "data/tcg");
const bySetDir = path.join(outDir, "by-set");
const names = JSON.parse(fs.readFileSync(path.join(root, "data/names/species-zh.json"), "utf8"));
const replacements = Object.entries(names).sort((a, b) => b[0].length - a[0].length);

function zhName(english) {
  let next = english;
  for (const [from, to] of replacements) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu");
    next = next.replace(pattern, to);
  }
  return next === english ? null : next;
}

async function readIndex(page, url, region) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  const title = await page.title();
  if (title.startsWith("Just a moment")) throw new Error(`blocked ${url}`);
  return parseSets(await page.content(), region);
}

async function readSet(page, set) {
  const url = `https://www.tcgcollector.com/sets/${set.id}/${set.slug}`;
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  const title = await page.title();
  if (title.startsWith("Just a moment")) throw new Error(`blocked ${set.id}`);
  return parseCards(await page.content(), set);
}

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setUserAgent(
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
);
await page.setRequestInterception(true);
page.on("request", (request) => {
  const type = request.resourceType();
  if (type === "image" || type === "media" || type === "font") request.abort();
  else request.continue();
});

fs.mkdirSync(bySetDir, { recursive: true });
const indexes = [
  ...(await readIndex(page, "https://www.tcgcollector.com/sets/intl", "intl")),
  ...(await readIndex(page, "https://www.tcgcollector.com/sets/jp", "jp")),
];
const unique = [];
const seen = new Set();
for (const set of indexes) {
  if (seen.has(set.id)) continue;
  seen.add(set.id);
  unique.push(set);
}
console.log(`indexes ${unique.length}`);

let done = 0;
for (const set of unique) {
  done += 1;
  const file = path.join(bySetDir, `${set.id}.json`);
  if (fs.existsSync(file)) {
    if (done % 25 === 0) console.log(`${done}/${unique.length} skip ${set.code ?? set.name}`);
    continue;
  }
  let cards = [];
  try {
    cards = await readSet(page, set);
  } catch (error) {
    console.log(`retry ${set.id} ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      cards = await readSet(page, set);
    } catch (again) {
      console.log(`fail ${set.id} ${set.name} ${again.message}`);
    }
  }
  fs.writeFileSync(file, JSON.stringify({ set, cards }));
  console.log(`${done}/${unique.length} ${set.region} ${set.code ?? "-"} ${set.name} ${cards.length}`);
}

const sets = [];
const cards = [];
for (const set of unique) {
  const file = path.join(bySetDir, `${set.id}.json`);
  if (!fs.existsSync(file)) continue;
  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  sets.push({ ...saved.set, total: saved.cards.length, printedTotal: saved.cards.length });
  for (const card of saved.cards) {
    const zh = zhName(card.name);
    cards.push(zh ? { ...card, zh } : card);
  }
}
fs.writeFileSync(path.join(outDir, "sets.json"), JSON.stringify(sets));
fs.writeFileSync(path.join(outDir, "cards.json"), JSON.stringify(cards));
console.log(`wrote sets ${sets.length} cards ${cards.length}`);
await browser.close();
