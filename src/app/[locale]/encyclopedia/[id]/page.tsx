import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RarityMark } from "@/components/rarity-stamp";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { cardSubtitle, cardTitle } from "@/lib/catalog";
import { getCard } from "@/lib/content";
import { cardFinishes, finishLabel } from "@/lib/finishes";
import { textLabel, TYPE_DOT } from "@/lib/labels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const card = await getCard(id);
  const title = card ? cardTitle(card.names, locale) : "Collect Scheme";
  return { title };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ finish?: string | string[] }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const t = await getTranslations("encyclopedia");
  const search = await getTranslations("search");
  const card = await getCard(id);
  if (!card) notFound();
  const finishes = cardFinishes(card);
  const requested = one((await searchParams).finish);
  const finish = finishes.find((item) => item.id === requested) ?? finishes[0] ?? null;

  const title = cardTitle(card.names, locale);
  const subtitle = cardSubtitle(card.names, locale);
  const kinds = card.types.length > 0 ? card.types : [];

  const facts = [
    [t("set"), card.setName],
    [t("number"), `#${card.number}`],
    [t("rarity"), textLabel("rarity", card.rarity, locale)],
    [t("supertype"), textLabel("supertype", card.supertype, locale)],
    card.hp ? [t("hp"), card.hp] : null,
    card.subtypes.length
      ? [t("subtype"), card.subtypes.map((item) => textLabel("subtype", item, locale)).join(" · ")]
      : null,
  ].filter((row): row is [string, string] => row != null);

  return (
    <article className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
      <div className="mx-auto w-full max-w-xs">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-black/40">
          <Image
            src={card.imageLarge}
            alt={title}
            width={600}
            height={825}
            unoptimized
            priority
            className="h-auto w-full"
          />
          <RarityMark finish={finish} locale={locale} />
        </div>
      </div>
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Link href="/encyclopedia" className="text-sm text-primary">
            {t("back")}
          </Link>
          <h1 className="font-display text-4xl">{title}</h1>
          <Badge variant="outline" className="w-fit">
            {card.region === "jp" ? search("ja") : search("en")}
          </Badge>
          {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
          {locale === "zh" && !card.names.zh ? (
            <Badge variant="outline" className="w-fit">
              {t("missingZh")}
            </Badge>
          ) : null}
        </div>
        {kinds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {kinds.map((kind) => (
              <Badge key={kind} variant="secondary">
                <span className={`size-1.5 rounded-full ${TYPE_DOT[kind] ?? "bg-stone-300"}`} />
                {textLabel("type", kind, locale)}
              </Badge>
            ))}
          </div>
        ) : null}
        <section className="grid gap-2">
          <h2 className="text-sm font-medium">{t("looks")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("finishNote")}</p>
          {finishes.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {finishes.map((item) => (
                <Link
                  key={item.id}
                  href={item.id === finishes[0]?.id ? `/encyclopedia/${card.id}` : `/encyclopedia/${card.id}?finish=${item.id}`}
                  aria-current={finish?.id === item.id ? "page" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-sm ${finish?.id === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                >
                  {finishLabel(item, locale)}
                </Link>
              ))}
            </div>
          ) : finishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noRarity")}</p>
          ) : null}
          {card.region === "jp" ? (
            <a
              href={`https://www.pokemon-card.com/card-search/index.php?keyword=${encodeURIComponent(card.names.en)}&se_ta=&regulation_sidebar_form=all&pg=&illust=&sm_and_keyword=true`}
              className="text-sm text-primary"
              rel="noreferrer"
              target="_blank"
            >
              {t("official")}
            </a>
          ) : null}
        </section>
        <dl className="grid grid-cols-2 gap-3">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card px-3 py-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm">
                {label === t("set") ? (
                  <Link href={`/sets/${card.setId}`} className="text-primary">
                    {value}
                  </Link>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          href={`/trade/new?card=${card.id}`}
          className="inline-flex h-10 w-fit items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("tag")}
        </Link>
      </div>
    </article>
  );
}
