import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { RarityMark } from "@/components/rarity-stamp";
import { cardTitle } from "@/lib/catalog";
import { cardFinishes } from "@/lib/finishes";
import { textLabel, TYPE_DOT } from "@/lib/labels";
import type { CatalogCard } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export async function CardTile({
  card,
  locale,
  priority = false,
}: {
  card: CatalogCard;
  locale: string;
  priority?: boolean;
}) {
  const title = cardTitle(card.names, locale);
  const kinds = card.types.length > 0 ? card.types : card.supertype === "Trainer" ? ["Trainer"] : [];
  const finish = cardFinishes(card)[0] ?? null;

  return (
    <Link
      href={`/encyclopedia/${card.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-2 transition hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="relative aspect-[245/342] overflow-hidden rounded-xl bg-black/50">
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
      </div>
      <div className="flex flex-1 flex-col px-1 pt-2.5 pb-1">
        <p className="text-sm leading-snug font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[card.setCode, card.setName, card.number ? `#${card.number}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {card.rarity ? <Badge variant="outline">{textLabel("rarity", card.rarity, locale)}</Badge> : null}
          {kinds.slice(0, 2).map((kind) => (
            <Badge key={kind} variant="secondary">
              <span className={`size-1.5 rounded-full ${TYPE_DOT[kind] ?? "bg-stone-300"}`} />
              {textLabel("type", kind, locale)}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
