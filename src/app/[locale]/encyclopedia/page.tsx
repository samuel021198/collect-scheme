import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CardTile } from "@/components/card-tile";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { queryCards } from "@/lib/content";
import { cn } from "cn";

const PAGE_SIZE = 48;

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
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const q = one(raw.q).trim();
  const page = Math.max(1, Number(one(raw.page)) || 1);
  const t = await getTranslations("encyclopedia");
  const matched = q ? queryCards(q) : [];
  const start = (page - 1) * PAGE_SIZE;
  const cards = matched.slice(start, start + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));

  function href(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `/encyclopedia?${query}` : "/encyclopedia";
  }

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
        <button type="submit" className={cn(buttonVariants(), "h-11 px-5")}>
          {t("search")}
        </button>
      </form>

      {!q ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("prompt")}{" "}
          <Link href="/sets" className="text-primary">
            {t("browseSets")}
          </Link>
        </p>
      ) : cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("count", { count: matched.length })}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card, index) => (
              <CardTile key={card.id} card={card} locale={locale} priority={index < 4} />
            ))}
          </div>
          {pages > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href(page - 1)} className="text-primary">
                  {t("prev")}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground">
                {page} / {pages}
              </span>
              {page < pages ? (
                <Link href={href(page + 1)} className="text-primary">
                  {t("next")}
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
