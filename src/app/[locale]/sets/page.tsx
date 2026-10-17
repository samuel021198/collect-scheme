import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SetTile } from "@/components/set-tile";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { matchesPrint, parsePrintLang } from "@/lib/catalog";
import { groupSets, loadSets, seriesAnchor, seriesLabel, setsBrowseHref } from "@/lib/sets";
import { cn } from "cn";

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
  const lang = parsePrintLang(one(raw.lang));
  const t = await getTranslations("sets");
  const search = await getTranslations("search");
  const groups = groupSets(
    loadSets().filter((set) => matchesPrint(set.region, lang)),
    q,
  );
  const shown = groups.reduce((sum, group) => sum + group.sets.length, 0);

  return (
    <div className="grid gap-8">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label={search("lang")}>
        {(["en", "ja"] as const).map((value) => (
          <Link
            key={value}
            href={setsBrowseHref(value, q)}
            aria-current={lang === value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              lang === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {search(value)}
          </Link>
        ))}
      </div>

      <form action={`/${locale}/sets`} className="flex flex-col gap-2 sm:max-w-xl sm:flex-row">
        <Label htmlFor="set-q" className="sr-only">
          {t("searchLabel")}
        </Label>
        {lang === "ja" ? <input type="hidden" name="lang" value="ja" /> : null}
        <Input id="set-q" name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="h-11 sm:flex-1" />
        <button type="submit" className={cn(buttonVariants(), "h-11 px-5")}>
          {t("search")}
        </button>
      </form>

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
