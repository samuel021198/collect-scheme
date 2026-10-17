import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { cardTitle } from "@/lib/catalog";
import { loadCards } from "@/lib/content";

const PREVIEW = ["base1-4", "sv8-238", "me55-154"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("auction") };
}

export default async function AuctionPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations("auction");
  const cards = loadCards();
  const lots = PREVIEW.map((id) => cards.find((card) => card.id === id)).filter((card) => card != null);

  return (
    <div className="grid gap-8">
      <div className="grid max-w-2xl gap-3">
        <p className="text-sm text-primary">{t("disabled")}</p>
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-7 text-muted-foreground">{t("body")}</p>
        <Link href="/trade" className="text-sm text-primary">
          {t("toTrade")}
        </Link>
      </div>
      <div className="grid gap-3 opacity-70">
        {lots.map((card) => (
          <div key={card.id} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-3 sm:grid-cols-[4.5rem_1fr_auto]">
            <Image src={card.imageSmall} alt="" width={72} height={100} unoptimized className="h-auto w-full rounded-lg" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("lot")}</p>
              <p className="font-medium">{cardTitle(card.names, locale)}</p>
              <p className="text-xs text-muted-foreground">
                {card.setName} · #{card.number}
              </p>
            </div>
            <Button type="button" disabled className="col-span-2 sm:col-span-1">
              {t("disabled")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
