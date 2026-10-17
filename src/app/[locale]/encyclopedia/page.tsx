import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CardTile } from "@/components/card-tile";
import { SearchBar } from "@/components/search-bar";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { parsePrintLang } from "@/lib/catalog";
import { queryCards } from "@/lib/content";
import { recentCards } from "@/lib/searches";
import { setsBrowseHref } from "@/lib/sets";

const PAGE_SIZE = 48;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("encyclopedia") };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function EncyclopediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string | string[];
    lang?: string | string[];
    page?: string | string[];
  }>;
}) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const q = one(raw.q).trim();
  const lang = parsePrintLang(one(raw.lang));
  const page = Math.max(1, Number(one(raw.page)) || 1);
  const t = await getTranslations("encyclopedia");
  const search = await getTranslations("search");
  const matched = q ? queryCards(q, lang) : [];
  const start = (page - 1) * PAGE_SIZE;
  const cards = matched.slice(start, start + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const shelf = q ? [] : recentCards();

  function href(nextPage: number) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("lang", lang);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/encyclopedia?${query.toString()}`;
  }

  return (
    <div className="grid gap-6">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      </div>

      <SearchBar locale={locale} q={q} lang={lang} mode="card" idPrefix="encyclopedia" />

      {!q ? (
        <section className="grid gap-4">
          <div className="grid gap-1">
            <h2 className="font-display text-2xl">{t("popular")}</h2>
            <p className="text-sm text-muted-foreground">{t("popularNote")}</p>
          </div>
          {shelf.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {t("prompt")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shelf.map((card, index) => (
                <CardTile key={card.id} card={card} locale={locale} priority={index < 4} />
              ))}
            </div>
          )}
        </section>
      ) : matched.length === 0 ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">{search(lang)}</p>
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {t("empty")}{" "}
            <Link href={setsBrowseHref(lang)} className="text-primary">
              {t("browseSets")}
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {search(lang)} · {t("count", { count: matched.length })}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card, index) => (
              <CardTile key={card.id} card={card} locale={locale} priority={index < 4} />
            ))}
          </div>
          {pages > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href(page - 1)} className="text-primary">
                  {t("prev")}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground">
                {page} / {pages}
              </span>
              {page < pages ? (
                <Link href={href(page + 1)} className="text-primary">
                  {t("next")}
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
