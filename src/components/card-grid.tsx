"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CardTile } from "@/components/card-tile";
import { useQuickAdd } from "@/components/quick-add";
import type { CatalogCard } from "@/lib/types";

export function CardGrid({
  cards,
  locale,
  priorityCount = 0,
}: {
  cards: CatalogCard[];
  locale: string;
  priorityCount?: number;
}) {
  const t = useTranslations("quick");
  const { open } = useQuickAdd();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function run(kind: "wish" | "collection" | "binder") {
    if (selected.length === 0) return;
    open(selected, kind);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`rounded-full border px-3 py-1.5 text-sm ${picking ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
          onClick={() => {
            setPicking((current) => !current);
            setSelected([]);
          }}
        >
          {picking ? t("picking") : t("pick")}
        </button>
        {picking && selected.length > 0 ? (
          <>
            <span className="text-sm text-muted-foreground">{t("selected", { count: selected.length })}</span>
            <button type="button" className="rounded-full border border-border px-3 py-1.5 text-sm" onClick={() => run("wish")}>{t("wish")}</button>
            <button type="button" className="rounded-full border border-border px-3 py-1.5 text-sm" onClick={() => run("collection")}>{t("collection")}</button>
            <button type="button" className="rounded-full border border-border px-3 py-1.5 text-sm" onClick={() => run("binder")}>{t("binder")}</button>
          </>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card, index) => (
          <CardTile
            key={card.id}
            card={card}
            locale={locale}
            priority={index < priorityCount}
            picking={picking}
            selected={selected.includes(card.id)}
            onPick={toggle}
          />
        ))}
      </div>
    </div>
  );
}
