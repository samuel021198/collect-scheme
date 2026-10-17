import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TradeForm } from "@/components/trade-form";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { getCard, loadCards } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("newTrade") };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function NewTradePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ card?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const cardId = one((await searchParams).card);
  const t = await getTranslations("trade");
  const initialCard = cardId ? await getCard(cardId) : null;

  return (
    <div className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <Link href="/trade" className="text-sm text-primary">
          {t("back")}
        </Link>
        <h1 className="font-display text-4xl">{t("formTitle")}</h1>
        <p className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6">{t("disclaimer")}</p>
      </div>
      <TradeForm cards={loadCards()} locale={locale} initialCard={initialCard} />
    </div>
  );
}
