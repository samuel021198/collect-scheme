"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { layoutSize, type BinderLayout } from "@/lib/binder-rules";

export type DeskSlot = {
  page: number;
  row: number;
  col: number;
  cardId: string;
  title: string;
  image: string;
  label: string;
};

export function BinderDesk({
  binderId,
  initialName,
  layout,
  pageIndexes,
  slots,
}: {
  binderId: string;
  initialName: string;
  layout: BinderLayout;
  pageIndexes: number[];
  slots: DeskSlot[];
}) {
  const t = useTranslations("binder");
  const account = useTranslations("account");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [page, setPage] = useState(pageIndexes[0] ?? 0);
  const [cards, setCards] = useState(slots);
  const [drag, setDrag] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { cols, rows } = layoutSize(layout);
  const pages = pageIndexes.length ? pageIndexes : [0];
  const shown = pages.includes(page) ? page : pages[0];

  async function call(url: string, method: string, body?: unknown) {
    setPending(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        setError(account("err_generic"));
        setPending(false);
        return false;
      }
      setPending(false);
      router.refresh();
      return true;
    } catch {
      setError(account("err_generic"));
      setPending(false);
      return false;
    }
  }

  function at(row: number, col: number) {
    return cards.find((slot) => slot.page === shown && slot.row === row && slot.col === col) ?? null;
  }

  function move(fromKey: string, row: number, col: number) {
    const [fromPage, fromRow, fromCol] = fromKey.split(":").map(Number);
    if (fromPage === shown && fromRow === row && fromCol === col) return;
    const source = cards.find((slot) => slot.page === fromPage && slot.row === fromRow && slot.col === fromCol);
    const target = cards.find((slot) => slot.page === shown && slot.row === row && slot.col === col);
    if (!source) return;
    setCards((current) =>
      current
        .filter((slot) => slot !== source && slot !== target)
        .concat([{ ...source, page: shown, row, col }], target ? [{ ...target, page: fromPage, row: fromRow, col: fromCol }] : []),
    );
    void call(`/api/binders/${binderId}/move`, "POST", {
      from: { page: fromPage, row: fromRow, col: fromCol },
      to: { page: shown, row, col },
    });
  }

  return (
    <div className="grid gap-5">
      <Link href="/binders" className="text-sm text-primary">{t("back")}</Link>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void call(`/api/binders/${binderId}`, "PATCH", { name });
        }}
      >
        <Input value={name} aria-label={t("name")} onChange={(event) => setName(event.target.value)} className="h-11 max-w-md" />
        <Button type="submit" variant="outline" className="h-11" disabled={pending}>{t("rename")}</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {(["3x3", "4x3", "4x4"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={layout === value ? "default" : "outline"}
            disabled={pending}
            onClick={() => {
              void call(`/api/binders/${binderId}`, "PATCH", { layout: value });
            }}
          >
            {value.replace("x", "×")}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {pages.map((index) => (
          <Button key={index} type="button" size="sm" variant={shown === index ? "default" : "outline"} onClick={() => setPage(index)}>
            {index + 1}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => void call(`/api/binders/${binderId}/pages`, "POST").then((ok) => ok && setPage(pages.length))}>
          {t("addPage")}
        </Button>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows * cols }, (_, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          const slot = at(row, col);
          const key = `${shown}:${row}:${col}`;
          return (
            <div
              key={key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const from = event.dataTransfer.getData("text/plain") || drag;
                if (from) move(from, row, col);
                setDrag(null);
              }}
              className="relative aspect-[245/342] rounded-xl border border-dashed border-border bg-black/30"
            >
              {slot ? (
                <div
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", key);
                    setDrag(key);
                  }}
                  className="absolute inset-0 cursor-grab"
                >
                  <Link href={`/encyclopedia/${slot.cardId}`} draggable={false} className="absolute inset-0">
                    {slot.image ? <Image src={slot.image} alt="" fill unoptimized sizes="160px" className="object-contain" /> : null}
                  </Link>
                  <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px]">{slot.label}</span>
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded bg-background/80 px-1.5 text-xs"
                    onClick={() => {
                      setCards((current) => current.filter((item) => item !== slot));
                      void call(`/api/binders/${binderId}/slots?page=${shown}&row=${row}&col=${col}`, "DELETE");
                    }}
                  >
                    {t("clear")}
                  </button>
                </div>
              ) : (
                <span className="absolute inset-0" />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t("dragHint")}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {confirmDelete ? (
        <Button type="button" variant="destructive" disabled={pending} onClick={() => void call(`/api/binders/${binderId}`, "DELETE").then((ok) => ok && router.push("/binders"))}>
          {t("deleteConfirm")}
        </Button>
      ) : (
        <Button type="button" variant="ghost" className="w-fit" onClick={() => setConfirmDelete(true)}>{t("delete")}</Button>
      )}
    </div>
  );
}
