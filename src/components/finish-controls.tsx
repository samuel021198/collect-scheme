"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { RarityMark } from "@/components/rarity-stamp";
import { finishLabel, type Finish } from "@/lib/finishes";

function chosen(finishes: Finish[], requested: string | null) {
  return finishes.find((item) => item.id === requested) ?? finishes[0] ?? null;
}

export function FinishMark({ finishes, locale }: { finishes: Finish[]; locale: string }) {
  return (
    <Suspense fallback={null}>
      <Mark finishes={finishes} locale={locale} />
    </Suspense>
  );
}

function Mark({ finishes, locale }: { finishes: Finish[]; locale: string }) {
  const requested = useSearchParams().get("finish");
  return <RarityMark finish={chosen(finishes, requested)} locale={locale} corner="left" />;
}

export function FinishChoices({
  cardId,
  finishes,
  locale,
}: {
  cardId: string;
  finishes: Finish[];
  locale: string;
}) {
  if (finishes.length < 2) return null;
  return (
    <Suspense fallback={null}>
      <Choices cardId={cardId} finishes={finishes} locale={locale} />
    </Suspense>
  );
}

function Choices({ cardId, finishes, locale }: { cardId: string; finishes: Finish[]; locale: string }) {
  const requested = useSearchParams().get("finish");
  const finish = chosen(finishes, requested);
  return (
    <div className="flex flex-wrap gap-2">
      {finishes.map((item) => (
        <Link
          key={item.id}
          href={item.id === finishes[0]?.id ? `/encyclopedia/${cardId}` : `/encyclopedia/${cardId}?finish=${item.id}`}
          aria-current={finish?.id === item.id ? "page" : undefined}
          className={`rounded-full border px-3 py-1.5 text-sm ${finish?.id === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
        >
          {finishLabel(item, locale)}
        </Link>
      ))}
    </div>
  );
}
