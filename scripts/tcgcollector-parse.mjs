const MONTHS = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

export function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function parseRelease(text) {
  const match = text.trim().match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
  if (!match) return null;
  const month = MONTHS[match[1]];
  if (!month) return null;
  return `${match[3]}-${month}-${match[2].padStart(2, "0")}`;
}

export function parseSets(html, region) {
  const seriesParts = html.split(/<h2[^>]*set-search-result-group-title/);
  const sets = [];
  const seen = new Set();
  for (const part of seriesParts.slice(1)) {
    const heading = part.match(/>([^<]*Series|[^<]+)<\/h2>/);
    const series = decodeHtml((heading?.[1] ?? "Other").replace(/\s+/g, " ").trim()).replace(/ (Series|Era)$/, "");
    const items = part.split('class="set-logo-grid-item set-search-result-item"');
    for (const item of items.slice(1)) {
      const id = item.match(/data-set-id="(\d+)"/)?.[1];
      const href = item.match(/href="(\/sets\/\d+\/[^"?]+)/)?.[1];
      const name = decodeHtml(item.match(/class="set-logo-grid-item-name"[^>]*>([^<]+)</)?.[1]?.trim() ?? "");
      const code = decodeHtml(item.match(/class="set-logo-grid-item-code">\s*([^<]+?)\s*</)?.[1]?.trim() ?? "");
      const release = parseRelease(item.match(/set-logo-grid-item-release-date">\s*([^<]+?)\s*</)?.[1] ?? "");
      const symbolSrc = srcBefore(item, 'class="set-symbol');
      const logoSrc = srcBefore(item, 'class="set-logo-grid-item-logo"');
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      const slug = href?.split("/").pop() ?? "";
      sets.push({
        id,
        slug,
        name,
        series,
        code: code || null,
        region,
        releaseDate: release,
        symbol: symbolSrc,
        logo: logoSrc,
      });
    }
  }
  return sets;
}

function srcBefore(html, marker) {
  const at = html.indexOf(marker);
  if (at < 0) return "";
  const start = html.lastIndexOf("<img", at);
  if (start < 0) return "";
  return html.slice(start, at).match(/src="([^"]+)"/)?.[1] ?? "";
}

export function parseCards(html, set) {
  const parts = html.split(/card-image-grid-item\s+card-search-result-item/);
  const cards = [];
  const seen = new Set();
  for (const part of parts.slice(1)) {
    const id = part.match(/data-card-id="(\d+)"/)?.[1];
    if (!id || seen.has(id)) continue;
    const titleMatch = part.match(/title="([^"]+)"[^>]*class="card-image-grid-item-link"|class="card-image-grid-item-link"[^>]*title="([^"]+)"/);
    const title = decodeHtml(titleMatch?.[1] || titleMatch?.[2] || "");
    const image = srcBefore(part, 'class="card-image-grid-item-image"');
    const rarityRaw = part.match(/alt="([^"]+)"[\s\S]{0,240}?class="card-rarity-symbol/)?.[1] ?? "";
    const rarity = decodeHtml(rarityRaw).replace(/\s*\([^)]*\)\s*$/, "").trim();
    const named = title.match(/^(.*) \((.*) (\d+\/\d+)\)$/);
    const name = (named?.[1] || title).trim();
    const number = named?.[3] ?? part.match(/card-image-grid-item-info-overlay-number">\s*([^<]+?)\s*</)?.[1]?.trim() ?? "";
    if (!name || !image) continue;
    seen.add(id);
    cards.push({
      id,
      name,
      number,
      rarity: rarity || "Unknown",
      image,
      setId: set.id,
      setName: set.name,
      setCode: set.code,
      series: set.series,
      region: set.region,
    });
  }
  return cards;
}
