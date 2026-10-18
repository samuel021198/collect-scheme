import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/search-bar";
import { SetTile } from "@/components/set-tile";
import { resolveLocale } from "@/i18n/locale";
import { matchesPrint, printForLocale } from "@/lib/catalog";
import { groupSets, loadSets, seriesAnchor, seriesLabel } from "@/lib/sets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("sets") };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; lang?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const q = one(raw.q);
  const lang = printForLocale(locale);
  const t = await getTranslations("sets");
  const groups = groupSets(
    loadSets().filter((set) => matchesPrint(set.region, lang)),
    q,
  );
  const shown = groups.reduce((sum, group) => sum + group.sets.length, 0);

  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl">{t("title")}</h1>

      <SearchBar locale={locale} q={q} lang={lang} mode="set" idPrefix="sets" />

      <p className="text-sm text-muted-foreground">{t("count", { count: shown })}</p>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <>
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={t("eras")}>
            {groups.map((group) => (
              <a
                key={group.series}
                href={`#${seriesAnchor(group.series)}`}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {seriesLabel(group.series, locale)}
                <span className="ml-1 text-xs text-muted-foreground/80">{group.sets.length}</span>
              </a>
            ))}
          </nav>

          {groups.map((group) => (
            <section key={group.series} id={seriesAnchor(group.series)} className="grid scroll-mt-28 gap-3">
              <h2 className="font-display text-2xl">{seriesLabel(group.series, locale)}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.sets.map((set) => (
                  <SetTile
                    key={set.id}
                    set={set}
                    locale={locale}
                    countLabel={t("cards", { count: set.printedTotal })}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
