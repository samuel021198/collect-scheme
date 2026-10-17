"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cardTitle, validatePost } from "@/lib/catalog";
import { textLabel } from "@/lib/labels";
import type { CatalogCard, ErrorCode } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import { useNick } from "./nick";

const ERRORS = new Set<ErrorCode>([
  "nick",
  "side",
  "card",
  "description",
  "contact",
  "body",
  "not_found",
  "full",
  "generic",
]);

export function TradeForm({
  locale,
  initialCard,
}: {
  locale: string;
  initialCard: CatalogCard | null;
}) {
  const t = useTranslations("trade");
  const errors = useTranslations("errors");
  const router = useRouter();
  const { nick, setNick } = useNick();
  const [authorDraft, setAuthorDraft] = useState<string | null>(null);
  const author = authorDraft ?? nick;
  const [side, setSide] = useState<"buy" | "sell">("sell");
  const [cardId, setCardId] = useState(initialCard?.id ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogCard[]>(initialCard ? [initialCard] : []);
  const requestId = useRef(0);
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  const selected = results.find((card) => card.id === cardId) ?? (initialCard?.id === cardId ? initialCard : null);

  async function onQuery(value: string) {
    setQuery(value);
    const q = value.trim();
    const id = ++requestId.current;
    if (q.length < 1) {
      setResults(initialCard ? [initialCard] : []);
      return;
    }
    try {
      const response = await fetch(`/api/cards?q=${encodeURIComponent(q)}`);
      const payload = (await response.json()) as { cards?: CatalogCard[] };
      if (id !== requestId.current) return;
      setResults(payload.cards ?? []);
    } catch {
      if (id === requestId.current) setResults([]);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const code = validatePost({ author, side, description, contact, cardId });
    if (code) {
      setError(code);
      return;
    }
    setPending(true);
    setError(null);
    setNick(author.trim());
    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          author: author.trim(),
          side,
          description,
          contact,
          cardId,
        }),
      });
      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        const next = payload.error && ERRORS.has(payload.error as ErrorCode) ? (payload.error as ErrorCode) : "generic";
        setError(next);
        setPending(false);
        return;
      }
      router.push(`/trade/${payload.id}`);
    } catch {
      setError("generic");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="author">{t("nick")}</Label>
        <Input
          id="author"
          value={author}
          onChange={(event) => setAuthorDraft(event.target.value)}
          autoComplete="nickname"
        />
        <p className="text-xs text-muted-foreground">{t("nickHint")}</p>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("side")}</legend>
        <div className="flex gap-2">
          {(["sell", "buy"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={side === value}
              onClick={() => setSide(value)}
              className={`rounded-full border px-3 py-1.5 text-sm ${side === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="card-filter">{t("card")}</Label>
        {selected ? (
          <p className="text-sm">
            {cardTitle(selected.names, locale)}
            <span className="text-muted-foreground">
              {" "}
              · {selected.setName} #{selected.number}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("cardMissing")}</p>
        )}
        <Input
          id="card-filter"
          value={query}
          placeholder={t("cardSearch")}
          onChange={(event) => void onQuery(event.target.value)}
        />
        <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{query.trim() ? t("cardEmpty") : t("cardMissing")}</p>
          ) : (
            results.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setCardId(card.id)}
                className={`flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 ${card.id === cardId ? "bg-primary/10" : "hover:bg-muted"}`}
              >
                <Image src={card.imageSmall} alt="" width={36} height={50} unoptimized className="h-12 w-9 rounded object-cover" />
                <span>
                  <span className="block text-sm">{cardTitle(card.names, locale)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[card.setCode, card.setName, card.number ? `#${card.number}` : ""].filter(Boolean).join(" · ")} ·{" "}
                    {textLabel("rarity", card.rarity, locale)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          value={description}
          placeholder={t("descriptionPlaceholder")}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-28"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="contact">{t("contactLabel")}</Label>
        <Input
          id="contact"
          value={contact}
          placeholder={t("contactPlaceholder")}
          onChange={(event) => setContact(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {errors(error)}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={cn(buttonVariants(), "h-10 w-fit px-4")}>
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
