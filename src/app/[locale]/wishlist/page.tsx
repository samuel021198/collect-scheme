import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { WishButton } from "@/components/wish-button";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { cardTitle, matchesPrint, printForLocale } from "@/lib/catalog";
import { listWishes } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wish" });
  return { title: t("title") };
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login?next=/wishlist`);
  const t = await getTranslations("wish");
  const print = printForLocale(locale);
  const cards = (await listWishes(user.id)).filter((card) => matchesPrint(card.region, print));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("count", { count: cards.length })}</p>
      </div>
      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => (
            <article key={card.id} className="rounded-2xl border border-border bg-card p-2">
              <div className="relative aspect-[245/342] overflow-hidden rounded-xl bg-black/40">
                <Link href={`/encyclopedia/${card.id}`} className="absolute inset-0">
                  <Image src={card.imageSmall} alt="" fill unoptimized sizes="200px" className="object-contain" />
                </Link>
                <WishButton cardId={card.id} wished />
              </div>
              <Link href={`/encyclopedia/${card.id}`} className="mt-2 block text-sm font-medium">
                {cardTitle(card.names, locale)}
              </Link>
              <p className="text-xs text-muted-foreground">
                {[card.setName, card.number ? `#${card.number}` : ""].filter(Boolean).join(" · ")}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
