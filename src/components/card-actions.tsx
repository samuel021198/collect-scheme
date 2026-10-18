"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ConditionFields } from "@/components/condition-fields";
import { Button } from "@/components/ui/button";
import { conditionLabel, gradesFor, type ConditionType } from "@/lib/grades";

type Item = { id: string; condition: ConditionType; grade: string; quantity: number };
type Binder = { id: string; name: string };
type Desk = { signedIn: boolean; items: Item[]; binders: Binder[] };

export function CardActions({ cardId }: { cardId: string }) {
  const t = useTranslations("collection");
  const binder = useTranslations("binder");
  const account = useTranslations("account");
  const router = useRouter();
  const login = `/login?next=${encodeURIComponent(`/encyclopedia/${cardId}`)}`;
  const [desk, setDesk] = useState<Desk | null>(null);
  const [condition, setCondition] = useState<ConditionType>("raw");
  const [grade, setGrade] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [itemId, setItemId] = useState("new");
  const [binderId, setBinderId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [holes, setHoles] = useState<{ page: number; row: number; col: number }[]>([]);
  const labels = { condition: t("condition"), grade: t("grade"), quantity: t("quantity"), raw: t("raw") };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/cards/${cardId}/desk`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: Desk) => {
        setDesk(body);
        setItemId(body.items[0]?.id ?? "new");
        setBinderId(body.binders[0]?.id ?? "");
      })
      .catch(() => setDesk({ signedIn: false, items: [], binders: [] }));
    return () => controller.abort();
  }, [cardId]);

  if (!desk) {
    return <div className="h-24 rounded-2xl border border-dashed border-border" />;
  }

  const items = desk.items;
  const binders = desk.binders;
  const signedIn = desk.signedIn;

  if (!signedIn) {
    return (
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={login} className="text-primary">{t("loginToAdd")}</Link>
        <Link href={login} className="text-primary">{binder("loginToAdd")}</Link>
      </div>
    );
  }

  function onCondition(value: ConditionType) {
    setCondition(value);
    const next = gradesFor(value);
    setGrade(next[0] ?? "");
  }

  async function send(url: string, body: unknown) {
    setPending(true);
    setError("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error === "condition" ? t("errCondition") : payload.error === "taken" ? binder("taken") : account("err_generic"));
        setPending(false);
        return false;
      }
      const next = (await fetch(`/api/cards/${cardId}/desk`).then((response) => response.json())) as Desk;
      setDesk(next);
      setItemId((current) =>
        current !== "new" && next.items.some((item) => item.id === current) ? current : (next.items[0]?.id ?? "new"),
      );
      setBinderId((current) => (next.binders.some((item) => item.id === current) ? current : (next.binders[0]?.id ?? "")));
      setPending(false);
      router.refresh();
      return true;
    } catch {
      setError(account("err_generic"));
      setPending(false);
      return false;
    }
  }

  const fresh = { cardId, condition, grade, quantity: Number(quantity) || 1 };
  const useNew = items.length === 0 || itemId === "new";

  return (
    <div className="grid gap-4">
      <form
        className="grid gap-3 rounded-2xl border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send("/api/collection", fresh);
        }}
      >
        <h2 className="text-sm font-medium">{t("add")}</h2>
        <ConditionFields
          idPrefix="own"
          condition={condition}
          grade={grade}
          quantity={quantity}
          labels={labels}
          onCondition={onCondition}
          onGrade={setGrade}
          onQuantity={setQuantity}
        />
        <Button type="submit" disabled={pending} className="h-10 w-fit">{t("add")}</Button>
      </form>

      <form
        className="grid gap-3 rounded-2xl border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!binderId) return;
          void send(`/api/binders/${binderId}/place`, useNew ? fresh : { collectionItemId: itemId });
        }}
      >
        <h2 className="text-sm font-medium">{binder("add")}</h2>
        {items.length > 0 ? (
          <label className="grid gap-1 text-sm">
            {binder("whichCopy")}
            <select value={itemId} className="h-10 rounded-lg border border-border bg-background px-2" onChange={(event) => setItemId(event.target.value)}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.condition === "raw" ? t("raw") : conditionLabel(item.condition, item.grade)} ×{item.quantity}
                </option>
              ))}
              <option value="new">{binder("newCopy")}</option>
            </select>
          </label>
        ) : null}
        {useNew ? (
          <ConditionFields
            idPrefix="slot"
            condition={condition}
            grade={grade}
            quantity={quantity}
            labels={labels}
            onCondition={onCondition}
            onGrade={setGrade}
            onQuantity={setQuantity}
          />
        ) : null}
        <label className="grid gap-1 text-sm">
          {binder("which")}
          <select
            value={binderId}
            className="h-10 rounded-lg border border-border bg-background px-2"
            onChange={(event) => {
              setBinderId(event.target.value);
              setHoles([]);
            }}
          >
            {binders.length === 0 ? <option value="">{binder("empty")}</option> : null}
            {binders.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || !binderId} className="h-10">{binder("firstEmpty")}</Button>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={pending || !binderId}
            onClick={() => {
              void fetch(`/api/binders/${binderId}`)
                .then((response) => response.json())
                .then((body: { binder?: { layout: string }; slots?: { page: number; row: number; col: number }[]; pageIndexes?: number[] }) => {
                  const layout = body.binder?.layout ?? "3x3";
                  const cols = layout === "3x3" ? 3 : 4;
                  const rows = layout === "4x4" ? 4 : 3;
                  const used = new Set((body.slots ?? []).map((slot) => `${slot.page}:${slot.row}:${slot.col}`));
                  const pages = body.pageIndexes?.length ? body.pageIndexes : [0];
                  const empty = pages.flatMap((page) =>
                    Array.from({ length: rows * cols }, (_, index) => ({ page, row: Math.floor(index / cols), col: index % cols })).filter(
                      (slot) => !used.has(`${slot.page}:${slot.row}:${slot.col}`),
                    ),
                  );
                  setHoles(empty);
                });
            }}
          >
            {binder("pickSlot")}
          </Button>
        </div>
        {holes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {holes.map((slot) => (
              <Button
                key={`${slot.page}-${slot.row}-${slot.col}`}
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  void send(`/api/binders/${binderId}/place`, { ...(useNew ? fresh : { collectionItemId: itemId }), ...slot });
                }}
              >
                {binder("slot", { page: slot.page + 1, row: slot.row + 1, col: slot.col + 1 })}
              </Button>
            ))}
          </div>
        ) : null}
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
