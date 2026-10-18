import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("auction") };
}

export default async function AuctionPage() {
  const t = await getTranslations("auction");

  return (
    <div className="grid max-w-lg gap-3">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <Link href="/trade" className="text-sm text-primary">
        {t("toTrade")}
      </Link>
    </div>
  );
}
