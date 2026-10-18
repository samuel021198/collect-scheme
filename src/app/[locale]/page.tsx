import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CardTile } from "@/components/card-tile";
import { SearchBar } from "@/components/search-bar";
import { resolveLocale } from "@/i18n/locale";
import { loadCards, loadShops } from "@/lib/content";
import { matchesPrint, printForLocale } from "@/lib/catalog";
import { recentCards } from "@/lib/searches";
import { loadSets } from "@/lib/sets";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("home");
  const print = printForLocale(locale);
  const cards = loadCards().filter((card) => matchesPrint(card.region, print));
  const sets = loadSets().filter((set) => matchesPrint(set.region, print));
  const featured = await recentCards(cards, print);

  return (
    <div className="grid gap-14">
      <section className="grid gap-6 pt-4 md:pt-8">
        <p className="text-sm tracking-wide text-primary">{t("eyebrow")}</p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight text-balance md:text-6xl">{t("title")}</h1>
        <div className="grid gap-4 lg:grid-cols-2">
          <SearchBar locale={locale} mode="card" idPrefix="home-card" heading />
          <SearchBar locale={locale} mode="set" idPrefix="home-set" heading />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("statCards", { count: cards.length })} · {t("statSets", { count: sets.length })} ·{" "}
          {t("statShops", { count: loadShops().length })}
        </p>
      </section>

      {featured.length > 0 ? (
        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl">{t("featured")}</h2>
            <Link href="/encyclopedia" className="text-sm text-primary">
              {t("seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((card, index) => (
              <CardTile key={card.id} card={card} locale={locale} priority={index < 4} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        <h2 className="font-display text-2xl">{t("pathsTitle")}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/sets" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("setsTitle")}</h3>
          </Link>
          <Link href="/encyclopedia" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("encyclopediaTitle")}</h3>
          </Link>
          <Link href="/shops" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("shopsTitle")}</h3>
          </Link>
          <Link href="/trade" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("tradeTitle")}</h3>
          </Link>
        </div>
      </section>

      <Link
        href="/auction"
        className="block rounded-2xl border border-dashed border-border px-5 py-4 text-muted-foreground hover:border-primary/40"
      >
        <p className="text-sm text-primary">{t("auctionTitle")}</p>
      </Link>
    </div>
  );
}
