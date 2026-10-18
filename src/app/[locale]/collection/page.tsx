import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { collectionRows, collectionStats, topPokemon } from "@/lib/collection-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collection" });
  return { title: t("title") };
}

export default async function CollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login?next=/collection`);
  const t = await getTranslations("collection");
  const rows = await collectionRows(user.id, locale);
  const stats = collectionStats(rows);
  const pokemon = topPokemon(rows).slice(0, 12);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <Link href="/collection/all" className="text-sm text-primary">{t("seeAll")}</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t("copies"), stats.copies],
          [t("unique"), stats.unique],
          [t("rawCount"), stats.raw],
          [t("gradedCount"), stats.graded],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display mt-1 text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">{t("most")}</h2>
        {pokemon.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {pokemon.map((item) => (
              <Link key={item.key} href={`/collection/${encodeURIComponent(item.key)}`} className="rounded-2xl border border-border bg-card p-2 hover:border-primary/50">
                <div className="relative aspect-[245/342] overflow-hidden rounded-xl bg-black/40">
                  {item.image ? <Image src={item.image} alt="" fill unoptimized sizes="140px" className="object-contain" /> : null}
                </div>
                <p className="mt-2 text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.quantity}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
