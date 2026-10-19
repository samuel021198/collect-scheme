"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CountField } from "@/components/count-field";
import { Button } from "@/components/ui/button";
import { cleanQuantity } from "@/lib/grades";

export function DropCopies({ id, owned, slotted = 0, onDone }: { id: string; owned: number; slotted?: number; onDone?: () => void }) {
  const t = useTranslations("collection");
  const router = useRouter();
  const [count, setCount] = useState("1");
  const [release, setRelease] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const amount = cleanQuantity(count);
  const asking = slotted > 0 && amount != null && amount < owned;
  const clearing = slotted > 0 && amount != null && amount >= owned;

  async function drop(event: React.FormEvent) {
    event.preventDefault();
    const quantity = cleanQuantity(count);
    if (!quantity || quantity > owned) {
      setError(t("errQuantity"));
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/collection/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity, release: asking && release }),
      });
      if (!response.ok) {
        setError(t("errQuantity"));
        setPending(false);
        return;
      }
      setCount("1");
      setRelease(false);
      setPending(false);
      onDone?.();
      router.refresh();
    } catch {
      setError(t("errQuantity"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void drop(event)} className="flex flex-wrap items-end gap-2">
      <CountField id={`drop-${id}`} value={count} max={owned} label={t("dropCount")} onChange={setCount} />
      <Button type="submit" variant="outline" className="h-12" disabled={pending}>
        {t("remove")}
      </Button>
      {asking ? (
        <label className="flex min-h-11 w-full items-center gap-2 text-sm">
          <input type="checkbox" className="size-5" checked={release} onChange={(event) => setRelease(event.target.checked)} />
          {t("release", { count: Math.min(amount ?? 0, slotted) })}
        </label>
      ) : null}
      {clearing ? <p className="w-full text-sm text-muted-foreground">{t("releaseAll", { count: slotted })}</p> : null}
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
