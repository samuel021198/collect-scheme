"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type BinderSlotView = {
  id: string;
  title: string;
  setLine: string;
  image: string;
  status: "wishlist" | "owned";
};

export function BinderBoard({
  binderId,
  initialName,
  coverCardId,
  slots,
}: {
  binderId: string;
  initialName: string;
  coverCardId: string | null;
  slots: BinderSlotView[];
}) {
  const t = useTranslations("binder");
  const account = useTranslations("account");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [cards, setCards] = useState(slots);
  const [cover, setCover] = useState(coverCardId);
  const [filter, setFilter] = useState<"all" | "wishlist" | "owned">("all");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const owned = cards.filter((card) => card.status === "owned").length;
  const shown = cards.filter((card) => filter === "all" || card.status === filter);

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
      return true;
    } catch {
      setError(account("err_generic"));
      setPending(false);
      return false;
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Link href="/binders" className="text-sm text-primary">
          {t("back")}
        </Link>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            void call(`/api/binders/${binderId}`, "PATCH", { name }).then((ok) => {
              if (ok) router.refresh();
            });
          }}
        >
          <Input value={name} aria-label={t("name")} onChange={(event) => setName(event.target.value)} className="h-11 max-w-md text-lg" />
          <Button type="submit" variant="outline" disabled={pending} className="h-11">
            {t("rename")}
          </Button>
        </form>
        <p className="font-display text-3xl">
          {t("progress", { owned, total: cards.length })}
          <span className="ml-3 text-base text-muted-foreground">{t("ownedLabel")}</span>
        </p>
        <div className="h-1.5 max-w-md overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={owned} aria-valuemax={cards.length}>
          <div className="h-full bg-primary" style={{ width: `${cards.length ? (owned / cards.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "wishlist", "owned"] as const).map((value) => (
          <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {t(value === "wishlist" ? "wanted" : value === "owned" ? "owned" : "all")}
          </Button>
        ))}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("emptyBinder")}</p>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("emptyFilter")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((card) => (
            <article key={card.id} className="flex flex-col rounded-2xl border border-border bg-card p-2">
              <Link href={`/encyclopedia/${card.id}`} className="relative aspect-[245/342] overflow-hidden rounded-xl bg-black/50">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 45vw, 220px"
                    className={card.status === "wishlist" ? "object-contain grayscale" : "object-contain"}
                  />
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col gap-2 px-1 pt-2.5 pb-1">
                <p className="text-sm leading-snug font-medium">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.setLine}</p>
                <p className="text-xs text-primary">{card.status === "owned" ? t("owned") : t("wanted")}</p>
                <div className="mt-auto flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="xs"
                    variant={card.status === "owned" ? "default" : "outline"}
                    disabled={pending}
                    onClick={() => {
                      const status = card.status === "owned" ? "wishlist" : "owned";
                      void call(`/api/binders/${binderId}/cards`, "PATCH", { cardId: card.id, status }).then((ok) => {
                        if (ok) setCards((current) => current.map((item) => (item.id === card.id ? { ...item, status } : item)));
                      });
                    }}
                  >
                    {card.status === "owned" ? t("markWanted") : t("markOwned")}
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={cover === card.id ? "secondary" : "ghost"}
                    disabled={pending}
                    onClick={() => {
                      void call(`/api/binders/${binderId}`, "PATCH", { coverCardId: card.id }).then((ok) => {
                        if (ok) setCover(card.id);
                      });
                    }}
                  >
                    {t("setCover")}
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      void call(`/api/binders/${binderId}/cards?card=${encodeURIComponent(card.id)}`, "DELETE").then((ok) => {
                        if (!ok) return;
                        setCards((current) => current.filter((item) => item.id !== card.id));
                        if (cover === card.id) setCover(null);
                      });
                    }}
                  >
                    {t("remove")}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        {confirmDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              void call(`/api/binders/${binderId}`, "DELETE").then((ok) => {
                if (ok) router.push("/binders");
              });
            }}
          >
            {t("deleteConfirm")}
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
            {t("delete")}
          </Button>
        )}
      </div>
    </div>
  );
}
