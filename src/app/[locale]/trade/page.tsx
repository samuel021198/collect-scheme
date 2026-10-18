import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { cardTitle, formatWhen, matchesPrint, printForLocale } from "@/lib/catalog";
import { loadCards } from "@/lib/content";
import { textLabel } from "@/lib/labels";
import { listPosts } from "@/lib/trades";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("trade") };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function TradePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ side?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const side = one((await searchParams).side);
  const t = await getTranslations("trade");
  const print = printForLocale(locale);
  const regions = new Map(loadCards().map((card) => [card.id, card.region]));
  const posts = (await listPosts()).filter(
    (post) =>
      matchesPrint(regions.get(post.card.id), print) && (side === "buy" || side === "sell" ? post.side === side : true),
  );
  const filters = [
    { href: "/trade", id: "all", label: t("all") },
    { href: "/trade?side=sell", id: "sell", label: t("sell") },
    { href: "/trade?side=buy", id: "buy", label: t("buy") },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid max-w-2xl gap-2">
          <h1 className="font-display text-4xl">{t("title")}</h1>
          <p className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6">{t("disclaimer")}</p>
        </div>
        <Link
          href="/trade/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("new")}
        </Link>
      </div>

      <div className="flex gap-2">
        {filters.map((filter) => {
          const active = filter.id === "all" ? side !== "buy" && side !== "sell" : side === filter.id;
          return (
            <Link key={filter.id} href={filter.href}>
              <Badge variant={active ? "default" : "outline"}>{filter.label}</Badge>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/trade/${post.id}`}
              className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/50 sm:grid-cols-[5.5rem_1fr]"
            >
              <Image
                src={post.card.imageSmall}
                alt=""
                width={88}
                height={124}
                unoptimized
                className="h-auto w-full rounded-lg bg-black/40"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={post.side === "buy" ? "secondary" : "default"}>{t(post.side)}</Badge>
                  <span className="text-xs text-muted-foreground">{formatWhen(post.createdAt, locale)}</span>
                </div>
                <h2 className="mt-2 truncate text-lg font-medium">{cardTitle(post.card.names, locale)}</h2>
                <p className="text-xs text-muted-foreground">
                  {post.card.setName} · #{post.card.number} · {textLabel("rarity", post.card.rarity, locale)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {post.author} · {t("replies", { count: post.replies.length })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
