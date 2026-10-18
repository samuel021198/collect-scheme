"use client";

import { useState } from "react";
import { BookOpen, Heart, Layers } from "lucide-react";
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
          className={`min-h-11 rounded-full border px-4 text-sm touch-manipulation ${picking ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
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
            <button type="button" aria-label={t("wish")} title={t("wish")} className="grid size-11 place-items-center rounded-full border border-border touch-manipulation" onClick={() => run("wish")}><Heart className="size-5" /></button>
            <button type="button" aria-label={t("collection")} title={t("collection")} className="grid size-11 place-items-center rounded-full border border-border touch-manipulation" onClick={() => run("collection")}><Layers className="size-5" /></button>
            <button type="button" aria-label={t("binder")} title={t("binder")} className="grid size-11 place-items-center rounded-full border border-border touch-manipulation" onClick={() => run("binder")}><BookOpen className="size-5" /></button>
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
