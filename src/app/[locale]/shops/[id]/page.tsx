import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { pickText } from "@/lib/catalog";
import { loadShops } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shop = loadShops().find((item) => item.id === id);
  return { title: shop?.name ?? "Collect Scheme" };
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const t = await getTranslations("shops");
  const shop = loadShops().find((item) => item.id === id);
  if (!shop) notFound();

  return (
    <article className="grid max-w-2xl gap-5">
      <Link href="/shops" className="text-sm text-primary">
        {t("back")}
      </Link>
      <div>
        <p className="text-sm text-primary">{pickText(shop.district, locale)}</p>
        <h1 className="font-display mt-1 text-4xl">{shop.name}</h1>
      </div>
      <p className="leading-7 text-muted-foreground">{pickText(shop.blurb, locale)}</p>
      <dl className="grid gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">{t("address")}</dt>
          <dd className="mt-1 text-sm leading-6">{pickText(shop.address, locale)}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <dt className="text-xs text-muted-foreground">{t("hours")}</dt>
          <dd className="mt-1 text-sm leading-6">{pickText(shop.hours, locale)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3 text-sm">
        <a href={shop.mapsUrl} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
          {t("maps")}
        </a>
        <a href={shop.website} className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
          {t("website")}
        </a>
      </div>
    </article>
  );
}
