import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BinderBoard } from "@/components/binder-board";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { binderSlots } from "@/lib/binders";
import { cardTitle } from "@/lib/catalog";
import { getCard } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  const book = user ? await binderSlots(user.id, id) : null;
  return { title: book?.binder.name ?? "Collect Scheme" };
}

export default async function BinderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login?next=/binders/${id}`);
  const book = await binderSlots(user.id, id);
  if (!book) notFound();
  const slots = await Promise.all(
    book.slots.map(async (slot) => {
      const card = await getCard(slot.cardId);
      return {
        id: slot.cardId,
        title: card ? cardTitle(card.names, locale) : slot.cardId,
        setLine: card ? [card.setCode, card.setName, card.number ? `#${card.number}` : ""].filter(Boolean).join(" · ") : "",
        image: card?.imageSmall ?? "",
        status: slot.status,
      };
    }),
  );

  return <BinderBoard binderId={book.binder.id} initialName={book.binder.name} coverCardId={book.binder.coverCardId} slots={slots} />;
}
