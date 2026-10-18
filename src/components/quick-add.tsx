"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { CountField } from "@/components/count-field";
import { Button } from "@/components/ui/button";
import { cleanQuantity } from "@/lib/grades";

type Kind = "wish" | "collection" | "binder";
type Draft = { ids: string[]; kind: Kind };
type Binder = { id: string; name: string };

type QuickAddValue = {
  signedIn: boolean | null;
  wished: Set<string>;
  toggleWish: (cardId: string) => void;
  open: (ids: string[], kind: Kind) => void;
};

const QuickAddContext = createContext<QuickAddValue | null>(null);

export function useQuickAdd() {
  const value = useContext(QuickAddContext);
  if (!value) throw new Error("Quick add is missing");
  return value;
}

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("quick");
  const router = useRouter();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [wished, setWished] = useState<Set<string>>(new Set());
  const [binders, setBinders] = useState<Binder[]>([]);
  const [binderId, setBinderId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [count, setCount] = useState("1");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const aborted = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
    fetch("/api/auth/me", { signal: controller.signal })
      .then((response) => response.json())
      .then((body: { user?: { name?: string } | null }) => setSignedIn(Boolean(body.user)))
      .catch((error) => {
        if (!aborted(error)) setSignedIn(false);
      });
    fetch("/api/wishlist", { signal: controller.signal })
      .then((response) => response.json())
      .then((body: { ids?: string[] }) => setWished(new Set(body.ids ?? [])))
      .catch((error) => {
        if (!aborted(error)) setWished(new Set());
      });
    fetch("/api/binders", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { binders: [] }))
      .then((body: { binders?: Binder[] }) => {
        const list = body.binders ?? [];
        setBinders(list);
        setBinderId(list[0]?.id ?? "");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);

  function login() {
    const search = window.location.search;
    const next = search ? `${pathname}${search}` : pathname;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  function toggleWish(cardId: string) {
    if (signedIn !== true) {
      if (signedIn === false) login();
      return;
    }
    const nextWished = !wished.has(cardId);
    setWished((current) => {
      const copy = new Set(current);
      if (nextWished) copy.add(cardId);
      else copy.delete(cardId);
      return copy;
    });
    void fetch("/api/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cardId }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("wish");
        const body = (await response.json()) as { wished?: boolean };
        setWished((current) => {
          const copy = new Set(current);
          if (body.wished) copy.add(cardId);
          else copy.delete(cardId);
          return copy;
        });
      })
      .catch(() => {
        setWished((current) => {
          const copy = new Set(current);
          if (nextWished) copy.delete(cardId);
          else copy.add(cardId);
          return copy;
        });
      });
  }

  function open(ids: string[], kind: Kind) {
    if (signedIn !== true) {
      if (signedIn === false) login();
      return;
    }
    setNote("");
    setCount("1");
    setDraft({ ids, kind });
  }

  async function confirm() {
    if (!draft) return;
    setPending(true);
    setNote("");
    try {
      if (draft.kind === "wish") {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cardIds: draft.ids }),
        });
        if (!response.ok) throw new Error("wish");
        setWished((current) => new Set([...current, ...draft.ids]));
        setNote(t("addedWish"));
        window.setTimeout(() => setNote(""), 2500);
      } else if (draft.kind === "collection") {
        const quantity = cleanQuantity(count);
        if (!quantity) {
          setNote(t("badCount"));
          setPending(false);
          return;
        }
        const response = await fetch("/api/collection", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cardIds: draft.ids, quantity }),
        });
        if (!response.ok) throw new Error("collection");
        setNote(t("addedCollection"));
        window.setTimeout(() => setNote(""), 2500);
      } else {
        const quantity = cleanQuantity(count);
        if (!quantity || quantity > 12) {
          setNote(t("badBinderCount"));
          setPending(false);
          return;
        }
        if (!binderId) {
          setNote(t("noBinder"));
          setPending(false);
          return;
        }
        const response = await fetch(`/api/binders/${binderId}/place`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cardIds: draft.ids, quantity }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok && payload.error === "full") setNote(t("full"));
        else if (!response.ok) throw new Error("binder");
        else setNote(t("addedBinder"));
        window.setTimeout(() => setNote(""), 2500);
      }
      setDraft(null);
      setPending(false);
    } catch {
      setNote(t("failed"));
      setPending(false);
    }
  }

  return (
    <QuickAddContext.Provider value={{ signedIn, wished, toggleWish, open }}>
      {children}
      {draft ? <div className="h-48" /> : null}
      {note && !draft ? <p className="sr-only">{note}</p> : null}
      {draft ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur">
          <div className="mx-auto grid max-w-6xl gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{t(draft.kind)} · {t("selected", { count: draft.ids.length })}</p>
              <button type="button" className="text-sm text-muted-foreground" onClick={() => setDraft(null)}>
                {t("cancel")}
              </button>
            </div>
            {draft.kind !== "wish" ? (
              <CountField id="quick-count" value={count} max={draft.kind === "binder" ? 12 : 99} label={t("each")} onChange={setCount} />
            ) : null}
            {draft.kind === "binder" ? (
              binders.length === 0 ? (
                <Link href="/binders" className="text-sm text-primary">{t("noBinder")}</Link>
              ) : (
                <label className="grid gap-1 text-sm">
                  {t("which")}
                  <select
                    value={binderId}
                    className="h-10 rounded-lg border border-border bg-background px-2"
                    onChange={(event) => setBinderId(event.target.value)}
                  >
                    {binders.map((binder) => (
                      <option key={binder.id} value={binder.id}>{binder.name}</option>
                    ))}
                  </select>
                </label>
              )
            ) : null}
            {note ? <p className="text-sm text-primary">{note}</p> : null}
            <Button type="button" className="h-10 w-fit" disabled={pending || (draft.kind === "binder" && !binderId)} onClick={() => void confirm()}>
              {t("add")}
            </Button>
          </div>
        </div>
      ) : note ? (
        <p className="fixed inset-x-0 bottom-3 z-40 mx-auto w-fit rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">{note}</p>
      ) : null}
    </QuickAddContext.Provider>
  );
}

export function QuickButtons({ cardId, compact = false }: { cardId: string; compact?: boolean }) {
  const t = useTranslations("quick");
  const { wished, toggleWish, open } = useQuickAdd();
  const saved = wished.has(cardId);
  const className = compact
    ? "rounded-md border border-border px-1.5 py-1 text-[10px] leading-none"
    : "rounded-md bg-background/90 px-1 py-1.5 text-[10px] leading-none";
  return (
    <div className={compact ? "flex gap-1" : "grid grid-cols-3 gap-1"}>
      <button type="button" className={`${className} ${saved ? "text-rose-500" : ""}`} onClick={() => toggleWish(cardId)}>
        {saved ? t("wished") : t("wish")}
      </button>
      <button type="button" className={className} onClick={() => open([cardId], "collection")}>
        {t("collection")}
      </button>
      <button type="button" className={className} onClick={() => open([cardId], "binder")}>
        {t("binder")}
      </button>
    </div>
  );
}
