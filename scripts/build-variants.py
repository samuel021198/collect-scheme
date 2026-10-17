#!/usr/bin/env python3
"""Match TCGdex per-card printings onto the Collect Scheme catalog.

TCGdex records, for each card, which physical printings exist: normal, holo,
reverse, a foil pattern such as cosmos, and stamps. A series-wide rule is wrong
because the next number in the same set often does not share those printings.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path("/tmp/cards-database")
OUT = Path("/workspace/data/tcg/variants.json")
CARDS = Path("/workspace/data/tcg/cards.json")


def read_block(text: str, start: int) -> str:
    opener = text[start]
    closer = "]" if opener == "[" else "}"
    depth = 0
    i = start
    while i < len(text):
        char = text[i]
        if char in "[{":
            depth += 1
        elif char in "]}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
        i += 1
    return text[start:]


def grab(pattern: str, text: str) -> str | None:
    match = re.search(pattern, text)
    return match.group(1) if match else None


def quoted_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    return re.findall(r"""['"]([^'"]+)['"]""", raw)


def split_objects(array_src: str) -> list[str]:
    body = array_src.strip()[1:-1]
    objects: list[str] = []
    i = 0
    while i < len(body):
        if body[i] == "{":
            block = read_block(body, i)
            objects.append(block)
            i += len(block)
        else:
            i += 1
    return objects


def compact(item: dict) -> dict:
    out = {"t": item["t"]}
    if item.get("f"):
        out["f"] = item["f"]
    if item.get("s"):
        out["s"] = item["s"]
    if item.get("u") and item["u"] != "unlimited":
        out["u"] = item["u"]
    if item.get("z") == "jumbo":
        out["z"] = "jumbo"
    return out


def parse_array(src: str, region: str) -> list[dict]:
    prints: list[dict] = []
    for obj in split_objects(src):
        kind = grab(r"""type\s*:\s*['"]([^'"]+)['"]""", obj)
        if not kind:
            continue
        languages = quoted_list(grab(r"languages\s*:\s*(\[[^\]]*\])", obj))
        if languages:
            want = "ja" if region == "jp" else "en"
            if want not in languages:
                continue
        item: dict = {"t": kind}
        foil = grab(r"""foil\s*:\s*['"]([^'"]+)['"]""", obj)
        subtype = grab(r"""subtype\s*:\s*['"]([^'"]+)['"]""", obj)
        size = grab(r"""size\s*:\s*['"]([^'"]+)['"]""", obj)
        stamps = quoted_list(grab(r"stamp\s*:\s*(\[[^\]]*\])", obj))
        if foil:
            item["f"] = foil
        if subtype:
            item["u"] = subtype
        if stamps:
            item["s"] = stamps
        if size == "jumbo":
            item["z"] = "jumbo"
        prints.append(compact(item))
    return prints


def flag(name: str, src: str, default: bool) -> bool:
    match = re.search(rf"\b{name}\s*:\s*(true|false)", src)
    if not match:
        return default
    return match.group(1) == "true"


def parse_object(src: str) -> list[dict]:
    normal = flag("normal", src, True)
    reverse = flag("reverse", src, False)
    holo = flag("holo", src, False)
    first = flag("firstEdition", src, False)
    wpromo = flag("wPromo", src, False)
    prints: list[dict] = []

    def add(kind: str, stamps: list[str] | None = None) -> None:
        item: dict = {"t": kind}
        if stamps:
            item["s"] = stamps
        prints.append(item)

    if normal:
        add("normal")
        if first:
            add("normal", ["1st-edition"])
        if wpromo:
            add("normal", ["w-promo"])
    if reverse:
        add("reverse")
        if first:
            add("reverse", ["1st-edition"])
    if holo:
        add("holo")
        if first:
            add("holo", ["1st-edition"])
    return prints or [{"t": "normal"}]


def parse_variants(text: str, region: str) -> list[dict] | None:
    match = re.search(r"\bvariants\s*:", text)
    if not match:
        return None
    i = match.end()
    while i < len(text) and text[i].isspace():
        i += 1
    if i >= len(text) or text[i] not in "{[":
        return None
    block = read_block(text, i)
    if block.startswith("["):
        return parse_array(block, region)
    return parse_object(block)


def name_block(text: str) -> dict[str, str]:
    match = re.search(r"\bname\s*:\s*\{", text)
    if not match:
        return {}
    block = read_block(text, match.end() - 1)
    names: dict[str, str] = {}
    for key, value in re.findall(r"""['"]?([A-Za-z-]+)['"]?\s*:\s*['"]([^'"]+)['"]""", block):
        names[key] = value
    return names


def num_key(raw: str) -> str:
    token = raw.strip()
    if "/" in token:
        token = token.split("/", 1)[0].strip()
    token = re.sub(r"^No\.?\s*", "", token, flags=re.I).strip()
    if token.isdigit():
        return str(int(token))
    return token.lower()


def fold(value: str) -> str:
    return re.sub(r"[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]", "", value.lower())


def load_tcgdex() -> dict[tuple[str, str, str], list[dict]]:
    index: dict[tuple[str, str, str], list[dict]] = {}
    for root, region in ((ROOT / "data", "intl"), (ROOT / "data-asia", "jp")):
        for dirpath, dirnames, _files in os.walk(root):
            for folder in dirnames:
                set_file = Path(dirpath) / f"{folder}.ts"
                card_dir = Path(dirpath) / folder
                if not set_file.is_file():
                    continue
                set_text = set_file.read_text(encoding="utf-8", errors="replace")
                codes = {
                    grab(r"""\bid\s*:\s*['"]([^'"]+)['"]""", set_text),
                    grab(r"""tcgOnline\s*:\s*['"]([^'"]+)['"]""", set_text),
                    grab(r"""official\s*:\s*['"]([^'"]+)['"]""", set_text),
                }
                codes = {code.upper() for code in codes if code}
                names = name_block(set_text)
                for card_path in card_dir.glob("*.ts"):
                    text = card_path.read_text(encoding="utf-8", errors="replace")
                    if "category:" not in text and "category :" not in text:
                        continue
                    variants = parse_variants(text, region)
                    if not variants:
                        continue
                    names_on_card = [fold(value) for value in name_block(text).values() if value]
                    record = {"v": variants, "n": names_on_card, "set": names.get("en") or names.get("ja") or folder}
                    key_num = num_key(card_path.stem)
                    for code in codes:
                        bucket = index.setdefault((region, code, key_num), [])
                        bucket.append(record)
    return index


def choose(records: list[dict], card_name: str) -> list[dict] | None:
    if len(records) == 1:
        return records[0]["v"]
    wanted = fold(card_name)
    named = [record for record in records if wanted and wanted in record["n"]]
    if len(named) == 1:
        return named[0]["v"]
    unique = {json.dumps(record["v"], ensure_ascii=False, sort_keys=True) for record in (named or records)}
    if len(unique) == 1:
        return (named or records)[0]["v"]
    return None


def main() -> None:
    index = load_tcgdex()
    cards = json.loads(CARDS.read_text(encoding="utf-8"))
    out: dict[str, list] = {}
    matched = 0
    for card in cards:
        code = (card.get("setCode") or "").upper()
        if not code:
            continue
        region = "jp" if card.get("region") == "jp" else "intl"
        records = index.get((region, code, num_key(str(card.get("number") or ""))))
        if not records:
            continue
        variants = choose(records, card.get("name") or "")
        if not variants:
            continue
        previous = out.get(card["id"])
        if previous:
            seen = {json.dumps(item, sort_keys=True) for item in previous}
            for item in variants:
                key = json.dumps(item, sort_keys=True)
                if key not in seen:
                    previous.append(item)
                    seen.add(key)
        else:
            out[card["id"]] = variants
        matched += 1
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"cards {len(cards)} matched {matched} stored {len(out)} bytes {OUT.stat().st_size}")
    for sample in ("42370", "42375", "42377", "35585", "211", "41499"):
        print(sample, json.dumps(out.get(sample), ensure_ascii=False))


if __name__ == "__main__":
    main()
