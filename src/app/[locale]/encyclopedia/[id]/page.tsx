import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CardActions } from "@/components/card-actions";
import { FinishChoices, FinishMark } from "@/components/finish-controls";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { cardTitle } from "@/lib/catalog";
import { getCard } from "@/lib/content";
import { cardFinishes } from "@/lib/finishes";
import { textLabel } from "@/lib/labels";
import { listPostsCached } from "@/lib/trades";

export const revalidate = 300;

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

export default async function CardPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const t = await getTranslations("encyclopedia");
  const card = await getCard(id);
  if (!card) notFound();
  const finishes = cardFinishes(card);
  const title = cardTitle(card.names, locale);
  const attribute = card.types.length
    ? card.types.map((kind) => textLabel("type", kind, locale)).join(" · ")
    : card.supertype
      ? textLabel("supertype", card.supertype, locale)
      : "";
  const sellers = (await listPostsCached()).filter((post) => post.side === "sell" && post.card.id === card.id);

  const facts = [
    [t("set"), card.setName],
    [t("number"), `#${card.number}`],
    [t("rarity"), textLabel("rarity", card.rarity, locale)],
    attribute ? [t("type"), attribute] : null,
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
            sizes="280px"
            className="h-auto w-full"
          />
          <FinishMark finishes={finishes} locale={locale} />
        </div>
      </div>
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Link href="/encyclopedia" className="text-sm text-primary">
            {t("back")}
          </Link>
          <h1 className="font-display text-4xl">{title}</h1>
        </div>
        <FinishChoices cardId={card.id} finishes={finishes} locale={locale} />
        {finishes.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRarity")}</p> : null}
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
        <section className="grid gap-2">
          <h2 className="text-sm font-medium">{t("sellers")}</h2>
          {sellers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">{t("noSellers")}</p>
          ) : (
            <div className="grid gap-2">
              {sellers.map((post) => (
                <Link
                  key={post.id}
                  href={`/trade/${post.id}`}
                  className="rounded-xl border border-border bg-card px-3 py-2 hover:border-primary/50"
                >
                  <p className="text-sm font-medium">{post.author}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{post.contact}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
        <CardActions cardId={card.id} />
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
