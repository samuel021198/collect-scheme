import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RemoveItem } from "@/components/remove-item";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { collectionRows } from "@/lib/collection-view";
import { conditionLabel } from "@/lib/grades";
import { speciesTitle } from "@/lib/species";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; species: string }> }): Promise<Metadata> {
  const { locale, species } = await params;
  return { title: speciesTitle(decodeURIComponent(species), locale) };
}

export default async function SpeciesPage({ params }: { params: Promise<{ locale: string; species: string }> }) {
  const { species } = await params;
  const locale = await resolveLocale(params);
  const user = await currentUser();
  const key = decodeURIComponent(species);
  if (!user) redirect(`/${locale}/login?next=/collection/${encodeURIComponent(key)}`);
  const t = await getTranslations("collection");
  const rows = (await collectionRows(user.id, locale)).filter((row) => row.speciesKey === key);
  const total = rows.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <div className="grid gap-5">
      <Link href="/collection" className="text-sm text-primary">{t("back")}</Link>
      <div>
        <h1 className="font-display text-4xl">{speciesTitle(key, locale)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total}</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("emptyFilter")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-border bg-card p-2">
              <Link href={`/encyclopedia/${row.cardId}`} className="relative block aspect-[245/342] overflow-hidden rounded-xl bg-black/40">
                {row.image ? <Image src={row.image} alt="" fill unoptimized sizes="200px" className="object-contain" /> : null}
              </Link>
              <p className="mt-2 text-sm font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground">{[row.setName, row.number ? `#${row.number}` : ""].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-primary">{row.condition === "raw" ? t("raw") : conditionLabel(row.condition, row.grade)} · ×{row.quantity}</p>
              <RemoveItem id={row.id} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
