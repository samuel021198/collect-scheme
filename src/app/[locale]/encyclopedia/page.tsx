import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CardTile } from "@/components/card-tile";
import { SearchBar } from "@/components/search-bar";
import { SetTile } from "@/components/set-tile";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { parsePrintLang, parseSearchKind } from "@/lib/catalog";
import { queryCards } from "@/lib/content";
import { loadSets, matchSets, setsBrowseHref } from "@/lib/sets";

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
    kind?: string | string[];
    page?: string | string[];
  }>;
}) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const q = one(raw.q).trim();
  const lang = parsePrintLang(one(raw.lang));
  const kind = parseSearchKind(one(raw.kind));
  const page = Math.max(1, Number(one(raw.page)) || 1);
  const t = await getTranslations("encyclopedia");
  const search = await getTranslations("search");
  const setsT = await getTranslations("sets");
  const matchedCards = q && kind === "card" ? queryCards(q, lang) : [];
  const matchedSets = q && kind === "set" ? matchSets(loadSets(), q, lang) : [];
  const total = kind === "set" ? matchedSets.length : matchedCards.length;
  const start = (page - 1) * PAGE_SIZE;
  const cards = matchedCards.slice(start, start + PAGE_SIZE);
  const sets = matchedSets.slice(start, start + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(nextPage: number) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("lang", lang);
    query.set("kind", kind);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/encyclopedia?${query.toString()}`;
  }

  return (
    <div className="grid gap-6">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      </div>

      <SearchBar locale={locale} q={q} lang={lang} kind={kind} idPrefix="encyclopedia" />

      {!q ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("prompt")}{" "}
          <Link href={setsBrowseHref(lang)} className="text-primary">
            {t("browseSets")}
          </Link>
        </p>
      ) : total === 0 ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {search(lang)} · {search(kind)}
          </p>
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {kind === "set" ? t("setEmpty") : t("empty")}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {search(lang)} · {search(kind)} · {kind === "set" ? t("setCount", { count: total }) : t("count", { count: total })}
          </p>
          {kind === "set" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sets.map((set) => (
                <SetTile
                  key={set.id}
                  set={set}
                  locale={locale}
                  countLabel={setsT("cards", { count: set.printedTotal })}
                  languageLabel={set.region === "jp" ? search("ja") : search("en")}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((card, index) => (
                <CardTile key={card.id} card={card} locale={locale} priority={index < 4} />
              ))}
            </div>
          )}
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
