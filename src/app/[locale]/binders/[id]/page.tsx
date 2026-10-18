import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BinderDesk } from "@/components/binder-desk";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { binderView } from "@/lib/binders";
import { cardTitle } from "@/lib/catalog";
import { getCard } from "@/lib/content";
import { conditionLabel } from "@/lib/grades";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  const view = user ? await binderView(user.id, id) : null;
  return { title: view?.binder.name ?? "Collect Scheme" };
}

export default async function BinderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login?next=/binders/${id}`);
  const view = await binderView(user.id, id);
  if (!view) notFound();
  const collection = await getTranslations("collection");
  const slots = await Promise.all(
    view.slots.map(async (slot) => {
      const card = await getCard(slot.cardId);
      return {
        page: slot.page,
        row: slot.row,
        col: slot.col,
        cardId: slot.cardId,
        title: card ? cardTitle(card.names, locale) : slot.cardId,
        image: card?.imageSmall ?? "",
        label: slot.condition === "raw" ? collection("raw") : conditionLabel(slot.condition, slot.grade),
      };
    }),
  );

  return (
    <BinderDesk
      key={`${view.binder.layout}:${view.binder.name}:${view.pageIndexes.join(",")}:${slots.map((slot) => `${slot.page}-${slot.row}-${slot.col}-${slot.cardId}`).join("|")}`}
      binderId={view.binder.id}
      initialName={view.binder.name}
      layout={view.binder.layout}
      pageIndexes={view.pageIndexes}
      slots={slots}
    />
  );
}
