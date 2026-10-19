import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DropCopies } from "@/components/drop-copies";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { collectionRows, filterRows, sortRows, type CollectionRow } from "@/lib/collection-view";
import { conditionLabel, type ConditionType } from "@/lib/grades";

export const dynamic = "force-dynamic";

const sorts = ["recent", "set", "name", "grade"] as const;
const conditions = ["", "raw", "psa", "bgs", "cgc", "tag"] as const;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function line(row: CollectionRow, rawLabel: string) {
  const mark = row.condition === "raw" ? rawLabel : conditionLabel(row.condition, row.grade);
  return [row.setCode, row.setName, row.number ? `#${row.number}` : "", mark, `×${row.quantity}`].filter(Boolean).join(" · ");
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collection" });
  return { title: t("all") };
}

export default async function CollectionAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string | string[]; condition?: string | string[]; set?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login?next=/collection/all`);
  const raw = await searchParams;
  const sort = sorts.find((item) => item === one(raw.sort)) ?? "recent";
  const condition = conditions.find((item) => item === one(raw.condition)) ?? "";
  const setId = one(raw.set);
  const t = await getTranslations("collection");
  const allRows = await collectionRows(user.id, locale);
  const rows = sortRows(filterRows(allRows, condition as ConditionType | "", setId), sort);
  const sets = [...new Map(allRows.filter((row) => row.setId).map((row) => [row.setId, row.setName])).entries()];

  function href(next: { sort?: string; condition?: string; set?: string }) {
    const query = new URLSearchParams();
    const sortValue = next.sort ?? sort;
    const conditionValue = next.condition ?? condition;
    const setValue = next.set ?? setId;
    if (sortValue !== "recent") query.set("sort", sortValue);
    if (conditionValue) query.set("condition", conditionValue);
    if (setValue) query.set("set", setValue);
    const text = query.toString();
    return text ? `/collection/all?${text}` : "/collection/all";
  }

  return (
    <div className="grid gap-5">
      <Link href="/collection" className="text-sm text-primary">{t("back")}</Link>
      <h1 className="font-display text-4xl">{t("all")}</h1>
      <div className="flex flex-wrap gap-2">
        {sorts.map((item) => (
          <Link key={item} href={href({ sort: item })} className={`rounded-full border px-3 py-1.5 text-sm ${sort === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {t(item)}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {conditions.map((item) => (
          <Link key={item || "any"} href={href({ condition: item })} className={`rounded-full border px-3 py-1.5 text-sm ${condition === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {item === "" ? t("anyCondition") : item === "raw" ? t("raw") : item.toUpperCase()}
          </Link>
        ))}
      </div>
      {sets.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link href={href({ set: "" })} className={`shrink-0 rounded-full border px-3 py-1 text-sm ${setId === "" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{t("anySet")}</Link>
          {sets.map(([id, name]) => (
            <Link key={id} href={href({ set: id })} className={`shrink-0 rounded-full border px-3 py-1 text-sm ${setId === id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{name}</Link>
          ))}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("emptyFilter")}</p>
      ) : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <article key={row.id} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-2xl border border-border bg-card p-2">
              <Link href={`/encyclopedia/${row.cardId}`} className="relative h-24 overflow-hidden rounded-lg bg-black/40">
                {row.image ? <Image src={row.image} alt="" fill unoptimized sizes="72px" className="object-contain" /> : null}
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{line(row, t("raw"))}</p>
                <div className="mt-2">
                  <DropCopies key={`${row.id}:${row.quantity}:${row.slotted}`} id={row.id} owned={row.quantity} slotted={row.slotted} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
