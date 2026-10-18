"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CountField } from "@/components/count-field";
import { Button } from "@/components/ui/button";
import { cleanQuantity } from "@/lib/grades";

export function DropCopies({ id, owned, onDone }: { id: string; owned: number; onDone?: () => void }) {
  const t = useTranslations("collection");
  const router = useRouter();
  const [count, setCount] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        setError(t("errQuantity"));
        setPending(false);
        return;
      }
      setCount("1");
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
      <Button type="submit" variant="outline" className="h-10" disabled={pending}>
        {t("remove")}
      </Button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
