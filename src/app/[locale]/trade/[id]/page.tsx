import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ReplyForm } from "@/components/reply-form";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { cardSubtitle, cardTitle, formatWhen } from "@/lib/catalog";
import { textLabel } from "@/lib/labels";
import { getPost } from "@/lib/trades";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const post = getPost(id);
  const t = await getTranslations({ locale, namespace: "trade" });
  if (!post) return { title: "Collect Scheme" };
  return { title: `${t(post.side)} · ${cardTitle(post.card.names, locale)}` };
}

export default async function TradePostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const t = await getTranslations("trade");
  const post = getPost(id);
  if (!post) notFound();
  const title = cardTitle(post.card.names, locale);
  const subtitle = cardSubtitle(post.card.names, locale);

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_1fr]">
      <div className="grid gap-3">
        <Link href="/trade" className="text-sm text-primary">
          {t("back")}
        </Link>
        <Image
          src={post.card.imageSmall}
          alt={title}
          width={245}
          height={342}
          unoptimized
          className="w-full max-w-xs rounded-2xl border border-border bg-black/40"
        />
        <Link href={`/encyclopedia/${post.card.id}`} className="text-sm text-primary">
          {title}
          {subtitle ? ` · ${subtitle}` : ""}
        </Link>
      </div>
      <div className="grid gap-6">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{t(post.side)}</Badge>
            <span className="text-xs text-muted-foreground">{formatWhen(post.createdAt, locale)}</span>
          </div>
          <h1 className="font-display text-4xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {post.card.setName} · #{post.card.number} · {textLabel("rarity", post.card.rarity, locale)}
          </p>
          <p className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6">{t("disclaimer")}</p>
        </header>
        <p className="whitespace-pre-wrap text-base leading-7">{post.description}</p>
        <p className="text-sm">
          <span className="text-muted-foreground">{t("contact")} · </span>
          <span className="break-all">{post.contact}</span>
          <span className="text-muted-foreground"> · {post.author}</span>
        </p>
        <section className="grid gap-4">
          <h2 className="font-display text-2xl">{t("thread")}</h2>
          {post.replies.length === 0 ? (
            <p className="text-sm leading-6 text-muted-foreground">{t("noReplies")}</p>
          ) : (
            <ol className="grid gap-3">
              {post.replies.map((reply) => (
                <li key={reply.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    {reply.author} · {formatWhen(reply.createdAt, locale)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{reply.body}</p>
                </li>
              ))}
            </ol>
          )}
          <ReplyForm postId={post.id} />
        </section>
      </div>
    </article>
  );
}
