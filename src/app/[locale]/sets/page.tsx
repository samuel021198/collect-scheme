import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { formatRelease, groupSets, loadSets, seriesAnchor, seriesLabel } from "@/lib/sets";
import { cn } from "cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("sets") };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const q = one((await searchParams).q);
  const t = await getTranslations("sets");
  const groups = groupSets(loadSets(), q);
  const shown = groups.reduce((sum, group) => sum + group.sets.length, 0);

  return (
    <div className="grid gap-8">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{t("intro")}</p>
      </div>

      <form action={`/${locale}/sets`} className="flex flex-col gap-2 sm:max-w-xl sm:flex-row">
        <Label htmlFor="set-q" className="sr-only">
          {t("searchLabel")}
        </Label>
        <Input id="set-q" name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="h-11 sm:flex-1" />
        <button type="submit" className={cn(buttonVariants(), "h-11 px-5")}>
          {t("search")}
        </button>
      </form>

      <p className="text-sm text-muted-foreground">{t("count", { count: shown })}</p>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <>
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={t("eras")}>
            {groups.map((group) => (
              <a
                key={group.series}
                href={`#${seriesAnchor(group.series)}`}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {seriesLabel(group.series, locale)}
                <span className="ml-1 text-xs text-muted-foreground/80">{group.sets.length}</span>
              </a>
            ))}
          </nav>

          {groups.map((group) => (
            <section key={group.series} id={seriesAnchor(group.series)} className="grid scroll-mt-28 gap-3">
              <h2 className="font-display text-2xl">{seriesLabel(group.series, locale)}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.sets.map((set) => (
                  <Link
                    key={set.id}
                    href={`/sets/${set.id}`}
                    className="grid gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/50"
                  >
                    <div className="flex h-16 items-center">
                      <Image
                        src={set.logo}
                        alt=""
                        width={220}
                        height={80}
                        unoptimized
                        style={{ width: "auto", height: "auto" }}
                        className="max-h-16 max-w-full object-contain"
                      />
                    </div>
                    <div className="grid gap-1">
                      <h3 className="text-base leading-6">{set.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {[set.code, formatRelease(set.releaseDate, locale), t("cards", { count: set.printedTotal })]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
