import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CardTile } from "@/components/card-tile";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { cardsInSet } from "@/lib/content";
import { formatRelease, getSet, seriesLabel, setsBrowseHref } from "@/lib/sets";
import type { PrintLang } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const set = getSet(id);
  return { title: set ? set.name : locale === "zh" ? "系列" : "Sets" };
}

const PAGE_SIZE = 48;

export default async function SetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const set = getSet(id);
  if (!set) notFound();
  const t = await getTranslations("sets");
  const search = await getTranslations("search");
  const lang: PrintLang = set.region === "jp" ? "ja" : "en";
  const pageValue = (await searchParams).page;
  const page = Math.max(1, Number(Array.isArray(pageValue) ? pageValue[0] : pageValue) || 1);
  const matched = cardsInSet(set.id);
  const cards = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));

  return (
    <article className="grid gap-8">
      <div className="grid gap-4">
        <Link href={setsBrowseHref(lang)} className="text-sm text-primary">
          {t("back")}
        </Link>
        {set.logo ? (
          <div className="flex h-20 items-center">
            <Image
              src={set.logo}
              alt=""
              width={280}
              height={96}
              unoptimized
              priority
              style={{ width: "auto", height: "auto" }}
              className="max-h-20 max-w-full object-contain"
            />
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          {set.symbol ? (
            <Image src={set.symbol} alt="" width={28} height={28} unoptimized className="mt-1 size-7" />
          ) : null}
          <div className="grid gap-1">
            <h1 className="font-display text-4xl">{set.name}</h1>
            <Badge variant="outline" className="mt-1 w-fit">
              {search(lang)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {seriesLabel(set.series, locale)}
              {set.code ? ` · ${set.code}` : ""} · {formatRelease(set.releaseDate, locale)}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:max-w-lg">
        <div className="rounded-xl border border-border bg-card px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t("printed")}</dt>
          <dd className="mt-1 text-sm">{set.printedTotal}</dd>
        </div>
        <div className="rounded-xl border border-border bg-card px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t("total")}</dt>
          <dd className="mt-1 text-sm">{set.total}</dd>
        </div>
      </dl>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl">{t("onShelf")}</h2>
        {matched.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm leading-6 text-muted-foreground">
            {t("shelfEmpty")}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t("cards", { count: matched.length })}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((card) => (
                <CardTile key={card.id} card={card} locale={locale} />
              ))}
            </div>
            {pages > 1 ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                {page > 1 ? (
                  <Link href={page === 2 ? `/sets/${set.id}` : `/sets/${set.id}?page=${page - 1}`} className="text-primary">
                    {t("prev")}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-muted-foreground">
                  {page} / {pages}
                </span>
                {page < pages ? (
                  <Link href={`/sets/${set.id}?page=${page + 1}`} className="text-primary">
                    {t("next")}
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            ) : null}
          </>
        )}
        {set.code ? (
          <Link href={setsBrowseHref(lang, set.code)} className="text-sm text-primary">
            {t("searchSet")}
          </Link>
        ) : null}
      </section>
    </article>
  );
}
