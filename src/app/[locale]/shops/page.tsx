import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { pickText } from "@/lib/catalog";
import { loadShops } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("shops") };
}

export default async function ShopsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("shops");
  const shops = loadShops();

  return (
    <div className="grid gap-6">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {shops.map((shop) => (
          <Link
            key={shop.id}
            href={`/shops/${shop.id}`}
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/50"
          >
            <p className="text-xs tracking-wide text-primary">{pickText(shop.district, locale)}</p>
            <h2 className="font-display mt-1 text-2xl">{shop.name}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{pickText(shop.address, locale)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
