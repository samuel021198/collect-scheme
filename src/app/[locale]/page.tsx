import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CardGrid } from "@/components/card-grid";
import { SearchBar } from "@/components/search-bar";
import { resolveLocale } from "@/i18n/locale";
import { loadCards, loadShops } from "@/lib/content";
import { matchesPrint, printForLocale } from "@/lib/catalog";
import { recentCards } from "@/lib/searches";
import { loadSets } from "@/lib/sets";

export const revalidate = 120;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("home");
  const print = printForLocale(locale);
  const cards = loadCards().filter((card) => matchesPrint(card.region, print));
  const sets = loadSets().filter((set) => matchesPrint(set.region, print));
  const featured = await recentCards(cards, print);

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <div className="grid gap-3 lg:grid-cols-2">
          <SearchBar locale={locale} mode="card" idPrefix="home-card" heading />
          <SearchBar locale={locale} mode="set" idPrefix="home-set" heading />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("statCards", { count: cards.length })} · {t("statSets", { count: sets.length })} ·{" "}
          {t("statShops", { count: loadShops().length })}
        </p>
      </section>

      {featured.length > 0 ? (
        <section className="grid gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">{t("featured")}</h2>
            <Link href="/encyclopedia" className="text-sm text-primary">
              {t("seeAll")}
            </Link>
          </div>
          <CardGrid cards={featured} locale={locale} priorityCount={4} />
        </section>
      ) : null}
    </div>
  );
}
