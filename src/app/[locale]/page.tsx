import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CardTile } from "@/components/card-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveLocale } from "@/i18n/locale";
import { loadCards, loadShops } from "@/lib/content";

const FEATURED = ["base1-4", "swsh7-215", "sv3pt5-199", "sv8-238", "me55-154", "sv8pt5-167", "sv4pt5-232", "neo1-9"];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("home");
  const cards = loadCards();
  const featured = FEATURED.map((id) => cards.find((card) => card.id === id)).filter((card) => card != null);

  return (
    <div className="grid gap-14">
      <section className="grid gap-6 pt-4 md:pt-8">
        <p className="text-sm tracking-wide text-primary">{t("eyebrow")}</p>
        <div className="grid max-w-3xl gap-4">
          <h1 className="font-display text-4xl leading-tight text-balance md:text-6xl">{t("title")}</h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{t("lede")}</p>
        </div>
        <form action={`/${locale}/encyclopedia`} className="flex max-w-xl flex-col gap-2 sm:flex-row">
          <Label htmlFor="home-q" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Input id="home-q" name="q" placeholder={t("searchPlaceholder")} className="h-11 sm:flex-1" />
          <Button type="submit" className="h-11 px-5">
            {t("search")}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          {t("statCards", { count: cards.length })} · {t("statShops", { count: loadShops().length })}
        </p>
      </section>

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

      <section className="grid gap-4">
        <h2 className="font-display text-2xl">{t("pathsTitle")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/encyclopedia" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("encyclopediaTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("encyclopediaBody")}</p>
          </Link>
          <Link href="/shops" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("shopsTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("shopsBody")}</p>
          </Link>
          <Link href="/trade" className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50">
            <h3 className="font-display text-xl">{t("tradeTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("tradeBody")}</p>
          </Link>
        </div>
      </section>

      <Link
        href="/auction"
        className="block rounded-2xl border border-dashed border-border px-5 py-4 text-muted-foreground hover:border-primary/40"
      >
        <p className="text-sm text-primary">{t("auctionTitle")}</p>
        <p className="mt-1 text-sm">{t("auctionBody")}</p>
      </Link>
    </div>
  );
}
