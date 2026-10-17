import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CardTile } from "@/components/card-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { FILTERS, filterCards } from "@/lib/catalog";
import { hasApiKey, searchCatalog } from "@/lib/content";
import { textLabel } from "@/lib/labels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("encyclopedia") };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function EncyclopediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; type?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const query = searchParams.then((value) => ({ q: one(value.q), type: one(value.type) }));
  const [{ q, type }, t] = await Promise.all([query, getTranslations("encyclopedia")]);
  const result = await searchCatalog(q);
  const cards = filterCards(result.cards, type);

  return (
    <div className="grid gap-6">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      </div>

      <form action={`/${locale}/encyclopedia`} className="flex flex-col gap-2 sm:max-w-xl sm:flex-row">
        <Label htmlFor="q" className="sr-only">
          {t("searchLabel")}
        </Label>
        <Input id="q" name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="h-11 sm:flex-1" />
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <Button type="submit" className="h-11 px-5">
          {t("search")}
        </Button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href={q ? `/encyclopedia?q=${encodeURIComponent(q)}` : "/encyclopedia"}>
          <Badge variant={type ? "outline" : "default"}>{t("all")}</Badge>
        </Link>
        {FILTERS.map((filter) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          params.set("type", filter);
          return (
            <Link key={filter} href={`/encyclopedia?${params.toString()}`}>
              <Badge variant={type === filter ? "default" : "outline"}>{textLabel("type", filter, locale)}</Badge>
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("count", { count: cards.length })} · {t(result.mode)} {hasApiKey() ? t("keyOn") : t("keyOff")}
      </p>

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
