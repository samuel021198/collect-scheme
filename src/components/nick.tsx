"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

const KEY = "collect-scheme-nick";
const EVENT = "collect-scheme-nick";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readNick() {
  return window.localStorage.getItem(KEY) ?? "";
}

const NickContext = createContext<{
  nick: string;
  setNick: (nick: string) => void;
} | null>(null);

export function NickProvider({ children }: { children: React.ReactNode }) {
  const nick = useSyncExternalStore(subscribe, readNick, () => "");

  function setNick(next: string) {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }

  return <NickContext.Provider value={{ nick, setNick }}>{children}</NickContext.Provider>;
}

export function useNick() {
  const value = useContext(NickContext);
  if (!value) throw new Error("NickProvider missing");
  return value;
}

export function NickChip() {
  const t = useTranslations("nick");
  const { nick, setNick } = useNick();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? nick;

  if (editing || !nick) {
    return (
      <form
        className="flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          const next = value.trim();
          if (next.length < 2) return;
          setNick(next);
          setDraft(null);
          setEditing(false);
        }}
      >
        <label className="sr-only" htmlFor="header-nick">
          {t("label")}
        </label>
        <Input
          id="header-nick"
          value={value}
          placeholder={t("placeholder")}
          onChange={(event) => setDraft(event.target.value)}
          className="h-8 w-32"
        />
        <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
          {t("save")}
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(nick);
        setEditing(true);
      }}
      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {nick}
      <span className="ml-2 text-primary">{t("change")}</span>
    </button>
  );
}
