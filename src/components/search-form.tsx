"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { PrintLang } from "@/lib/catalog";
import { cn } from "cn";

const pill =
  "inline-flex cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring";

type CardHit = {
  id: string;
  title: string;
  subtitle: string;
  setName: string;
  number: string;
  image: string;
  region: "intl" | "jp";
};

type SetHit = {
  id: string;
  name: string;
  code: string | null;
  series: string;
  region: "intl" | "jp";
};

export function SearchForm({
  locale,
  q = "",
  lang = "en",
  mode,
  idPrefix,
  heading = false,
  showLang = true,
  action,
  title,
  hint,
  placeholder,
  submit,
  langLabel,
  english,
  japanese,
  cardsLabel,
  setsLabel,
  emptyLabel,
}: {
  locale: string;
  q?: string;
  lang?: PrintLang;
  mode: "card" | "set";
  idPrefix: string;
  heading?: boolean;
  showLang?: boolean;
  action: string;
  title: string;
  hint: string;
  placeholder: string;
  submit: string;
  langLabel: string;
  english: string;
  japanese: string;
  cardsLabel: string;
  setsLabel: string;
  emptyLabel: string;
}) {
  const listId = useId();
  const [value, setValue] = useState(q);
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<CardHit[]>([]);
  const [sets, setSets] = useState<SetHit[]>([]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: query, locale });
      fetch(`/api/suggest?${params}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((body: { cards?: CardHit[]; sets?: SetHit[] }) => {
          setCards(body.cards ?? []);
          setSets(body.sets ?? []);
          setOpen(true);
        })
        .catch(() => undefined);
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [locale, value]);

  function note(body: { id?: string; q?: string }) {
    void fetch("/api/searches", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const show = open && value.trim().length >= 2;
  const nothing = cards.length === 0 && sets.length === 0;

  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-border bg-card p-4"
      onSubmit={() => note({ q: value.trim() })}
    >
      {heading ? (
        <div className="grid gap-1">
          <h2 className="font-display text-2xl">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
        </div>
      ) : null}
      {showLang ? (
        <fieldset className="grid gap-2">
          <legend className="text-xs text-muted-foreground">{langLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {(["en", "ja"] as const).map((item) => (
              <label key={item}>
                <input type="radio" name="lang" value={item} defaultChecked={lang === item} className="peer sr-only" />
                <span className={pill}>{item === "ja" ? japanese : english}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="lang" value={lang} />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Label htmlFor={`${idPrefix}-q`} className="sr-only">
          {title}
        </Label>
        <div className="relative sm:flex-1">
          <Input
            id={`${idPrefix}-q`}
            name="q"
            value={value}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={show}
            aria-controls={listId}
            className="h-11"
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (value.trim().length >= 2) setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          />
          {show ? (
            <div
              id={listId}
              className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-30 max-h-80 overflow-auto rounded-xl border border-border bg-popover p-2 shadow-lg"
              onMouseDown={(event) => event.preventDefault()}
            >
              {nothing ? <p className="px-2 py-3 text-sm text-muted-foreground">{emptyLabel}</p> : null}
              {(mode === "set" ? (["sets", "cards"] as const) : (["cards", "sets"] as const)).map((group) => {
                if (group === "cards" && cards.length > 0) {
                  return (
                    <div key="cards" className="grid gap-1">
                      <p className="px-2 pt-1 text-xs text-muted-foreground">{cardsLabel}</p>
                      {cards.map((card) => (
                        <Link
                          key={card.id}
                          href={`/encyclopedia/${card.id}`}
                          className="grid grid-cols-[2.5rem_1fr] items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
                          onClick={() => note({ id: card.id })}
                        >
                          {card.image ? (
                            <Image src={card.image} alt="" width={40} height={56} unoptimized className="h-14 w-10 rounded object-contain" />
                          ) : (
                            <span className="h-14 w-10 rounded bg-muted" />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm">{card.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {card.region === "jp" ? japanese : english}
                              {" · "}
                              {[card.setName, card.number ? `#${card.number}` : ""].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  );
                }
                if (group === "sets" && sets.length > 0) {
                  return (
                    <div key="sets" className="mt-1 grid gap-1">
                      <p className="px-2 pt-1 text-xs text-muted-foreground">{setsLabel}</p>
                      {sets.map((set) => (
                        <Link key={set.id} href={`/sets/${set.id}`} className="rounded-lg px-2 py-1.5 hover:bg-muted">
                          <span className="block truncate text-sm">{set.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {set.region === "jp" ? japanese : english}
                            {set.code ? ` · ${set.code}` : ""}
                            {set.series ? ` · ${set.series}` : ""}
                          </span>
                        </Link>
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : null}
        </div>
        <button type="submit" className={cn(buttonVariants(), "h-11 px-5")}>
          {submit}
        </button>
      </div>
    </form>
  );
}
