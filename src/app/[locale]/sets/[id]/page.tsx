import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CardTile } from "@/components/card-tile";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { loadCards } from "@/lib/content";
import { formatRelease, getSet, seriesLabel } from "@/lib/sets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const set = getSet(id);
  return { title: set ? set.name : locale === "zh" ? "系列" : "Sets" };
}

export default async function SetPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const set = getSet(id);
  if (!set) notFound();
  const t = await getTranslations("sets");
  const cards = loadCards().filter((card) => card.setId === set.id);

  return (
    <article className="grid gap-8">
      <div className="grid gap-4">
        <Link href="/sets" className="text-sm text-primary">
          {t("back")}
        </Link>
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
        <div className="flex items-start gap-3">
          <Image src={set.symbol} alt="" width={28} height={28} unoptimized className="mt-1 size-7" />
          <div className="grid gap-1">
            <h1 className="font-display text-4xl">{set.name}</h1>
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
        {cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-sm leading-6 text-muted-foreground">
            {t("shelfEmpty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => (
              <CardTile key={card.id} card={card} locale={locale} />
            ))}
          </div>
        )}
        <Link href={`/encyclopedia?q=${encodeURIComponent(set.name)}`} className="text-sm text-primary">
          {t("searchSet")}
        </Link>
      </section>
    </article>
  );
}
