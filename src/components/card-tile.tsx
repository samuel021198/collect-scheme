"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { QuickButtons } from "@/components/quick-add";
import { RarityMark } from "@/components/rarity-stamp";
import { Badge } from "@/components/ui/badge";
import { cardTitle } from "@/lib/catalog";
import { cardFinishes } from "@/lib/finishes";
import { textLabel, TYPE_DOT } from "@/lib/labels";
import type { CatalogCard } from "@/lib/types";

export function CardTile({
  card,
  locale,
  priority = false,
  picking = false,
  selected = false,
  onPick,
}: {
  card: CatalogCard;
  locale: string;
  priority?: boolean;
  picking?: boolean;
  selected?: boolean;
  onPick?: (id: string) => void;
}) {
  const title = cardTitle(card.names, locale);
  const kinds = card.types.length > 0 ? card.types : card.supertype === "Trainer" ? ["Trainer"] : [];
  const finish = cardFinishes(card)[0] ?? null;
  const meta = [card.setCode, card.setName, card.number ? `#${card.number}` : ""].filter(Boolean).join(" · ");

  function pick() {
    onPick?.(card.id);
  }

  const picture = (
    <>
      <Image
        src={card.imageSmall}
        alt=""
        fill
        unoptimized
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes="(max-width: 640px) 45vw, 220px"
        className="object-contain"
      />
      <RarityMark finish={finish} locale={locale} />
    </>
  );

  return (
    <article className={`flex flex-col rounded-2xl border bg-card p-2 ${selected ? "border-primary" : "border-border"}`}>
      <div className="relative aspect-[245/342] overflow-hidden rounded-xl bg-black/50">
        {picking ? (
          <button type="button" aria-pressed={selected} className="absolute inset-0" onClick={pick}>
            {picture}
          </button>
        ) : (
          <Link href={`/encyclopedia/${card.id}`} className="absolute inset-0">
            {picture}
          </Link>
        )}
        {picking ? (
          <span className={`pointer-events-none absolute top-2 left-2 z-20 grid size-6 place-items-center rounded-full text-xs ${selected ? "bg-primary text-primary-foreground" : "bg-background/90"}`}>
            {selected ? "✓" : ""}
          </span>
        ) : null}
      </div>
      {picking ? (
        <button type="button" className="px-1 pt-2.5 text-left" onClick={pick}>
          <span className="block text-sm leading-snug font-medium">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{meta}</span>
        </button>
      ) : (
        <Link href={`/encyclopedia/${card.id}`} className="px-1 pt-2.5">
          <span className="block text-sm leading-snug font-medium">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{meta}</span>
        </Link>
      )}
      <div className="mt-2 flex flex-wrap gap-1 px-1">
        {card.rarity ? <Badge variant="outline">{textLabel("rarity", card.rarity, locale)}</Badge> : null}
        {kinds.slice(0, 2).map((kind) => (
          <Badge key={kind} variant="secondary">
            <span className={`size-1.5 rounded-full ${TYPE_DOT[kind] ?? "bg-stone-300"}`} />
            {textLabel("type", kind, locale)}
          </Badge>
        ))}
      </div>
      <div className="mt-2">
        <QuickButtons cardId={card.id} />
      </div>
    </article>
  );
}
