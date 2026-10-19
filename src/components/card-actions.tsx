"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ConditionFields } from "@/components/condition-fields";
import { CountField } from "@/components/count-field";
import { DropCopies } from "@/components/drop-copies";
import { Button } from "@/components/ui/button";
import { cleanQuantity, conditionLabel, gradesFor, type ConditionType } from "@/lib/grades";

type Item = { id: string; condition: ConditionType; grade: string; quantity: number; slotted?: number };
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
        setItemId("new");
        setBinderId("");
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

  async function reload() {
    const next = (await fetch(`/api/cards/${cardId}/desk`).then((response) => response.json())) as Desk;
    setDesk(next);
    setItemId((current) =>
      current !== "new" && next.items.some((item) => item.id === current) ? current : (next.items[0]?.id ?? "new"),
    );
    setBinderId((current) => (next.binders.some((item) => item.id === current) ? current : (next.binders[0]?.id ?? "")));
    router.refresh();
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
        if (payload.error === "full") {
          setError(binder("full"));
          await reload();
          setPending(false);
          return false;
        }
        setError(
          payload.error === "condition"
            ? t("errCondition")
            : payload.error === "quantity"
              ? t("errQuantity")
              : payload.error === "taken"
                ? binder("taken")
                : account("err_generic"),
        );
        setPending(false);
        return false;
      }
      await reload();
      setPending(false);
      return true;
    } catch {
      setError(account("err_generic"));
      setPending(false);
      return false;
    }
  }

  const fresh = { cardId, condition, grade, quantity: Number(quantity) || 1 };
  const useNew = !binderId || items.length === 0 || itemId === "new";

  function placeBody(slot?: { page: number; row: number; col: number }) {
    const copies = Number(quantity) || 1;
    const base = useNew ? fresh : { collectionItemId: itemId, quantity: copies };
    return slot ? { ...base, ...slot } : base;
  }

  return (
    <div className="grid gap-4">
      <form
        className="grid gap-3 rounded-2xl border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const copies = cleanQuantity(quantity);
          if (!copies || (binderId && copies > 12)) {
            setError(binderId ? binder("badCount") : t("errQuantity"));
            return;
          }
          if (!binderId) {
            void send("/api/collection", fresh);
            return;
          }
          void send(`/api/binders/${binderId}/place`, placeBody());
        }}
      >
        <h2 className="text-sm font-medium">{binderId ? binder("add") : t("add")}</h2>
        {useNew ? (
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
        ) : (
          <CountField id="own-qty" value={quantity} max={12} label={labels.quantity} onChange={setQuantity} />
        )}
        {binders.length > 0 ? (
          <label className="grid gap-1 text-sm">
            {binder("which")}
            <select
              value={binderId}
              className="h-12 rounded-lg border border-border bg-background px-2 text-base"
              onChange={(event) => {
                setBinderId(event.target.value);
                setHoles([]);
              }}
            >
              <option value="">{t("collectionOnly")}</option>
              {binders.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        {binderId && items.length > 0 ? (
          <label className="grid gap-1 text-sm">
            {binder("whichCopy")}
            <select value={itemId} className="h-12 rounded-lg border border-border bg-background px-2 text-base" onChange={(event) => setItemId(event.target.value)}>
              <option value="new">{binder("newCopy")}</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.condition === "raw" ? t("raw") : conditionLabel(item.condition, item.grade)} ×{item.quantity}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={pending} className="h-12 w-full sm:w-fit">
            {binderId ? binder("firstEmpty") : t("add")}
          </Button>
          {binderId ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full sm:w-fit"
              disabled={pending}
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
          ) : null}
        </div>
        {holes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {holes.map((slot) => (
              <Button
                key={`${slot.page}-${slot.row}-${slot.col}`}
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() => {
                  const copies = cleanQuantity(quantity);
                  if (!copies) {
                    setError(t("errQuantity"));
                    return;
                  }
                  void send(`/api/binders/${binderId}/place`, placeBody(slot));
                }}
              >
                {binder("slot", { page: slot.page + 1, row: slot.row + 1, col: slot.col + 1 })}
              </Button>
            ))}
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {items.length > 0 ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">{t("owned")}</h2>
          {items.map((item) => (
            <div key={`${item.id}:${item.quantity}:${item.slotted ?? 0}`} className="grid gap-2">
              <p className="text-sm">
                {item.condition === "raw" ? t("raw") : conditionLabel(item.condition, item.grade)} · ×{item.quantity}
              </p>
              <DropCopies id={item.id} owned={item.quantity} slotted={item.slotted ?? 0} onDone={() => void reload()} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
