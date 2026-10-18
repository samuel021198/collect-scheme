"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Choice = { id: string; name: string; status: "wishlist" | "owned" | null };

export function AddToBinder({
  cardId,
  finish,
  binders,
}: {
  cardId: string;
  finish: string | null;
  binders: Choice[] | null;
}) {
  const t = useTranslations("binder");
  const account = useTranslations("account");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(binders ?? []);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!binders) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/encyclopedia/${cardId}`)}`} className="text-sm text-primary">
        {t("loginToAdd")}
      </Link>
    );
  }

  async function send(url: string, body: unknown, method = "POST") {
    setPending(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) {
        setError(payload.error === "full" ? t("full") : payload.error === "name" ? t("errName") : account("err_generic"));
        setPending(false);
        return null;
      }
      setPending(false);
      router.refresh();
      return payload;
    } catch {
      setError(account("err_generic"));
      setPending(false);
      return null;
    }
  }

  return (
    <div className="grid gap-3">
      <Button type="button" variant="outline" className="h-10 w-fit" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {t("add")}
      </Button>
      {open ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
          {rows.map((binder) => (
            <div key={binder.id} className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                {binder.name}
                {binder.status ? <span className="ml-2 text-muted-foreground">{binder.status === "owned" ? t("owned") : t("wanted")}</span> : null}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={binder.status === "wishlist" ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => {
                    void send(`/api/binders/${binder.id}/cards`, { cardId, status: "wishlist", finish }).then((result) => {
                      if (result) setRows((current) => current.map((row) => (row.id === binder.id ? { ...row, status: "wishlist" } : row)));
                    });
                  }}
                >
                  {t("wanted")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={binder.status === "owned" ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => {
                    void send(`/api/binders/${binder.id}/cards`, { cardId, status: "owned", finish }).then((result) => {
                      if (result) setRows((current) => current.map((row) => (row.id === binder.id ? { ...row, status: "owned" } : row)));
                    });
                  }}
                >
                  {t("owned")}
                </Button>
              </div>
            </div>
          ))}
          <form
            className="grid gap-2 border-t border-border pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send("/api/binders", { name, cardId, status: "wishlist", finish }).then((result) => {
                if (!result?.id) return;
                setRows((current) => [{ id: result.id as string, name: name.trim(), status: "wishlist" }, ...current]);
                setName("");
              });
            }}
          >
            <Label htmlFor="new-binder-name">{t("name")}</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="new-binder-name" value={name} placeholder={t("namePlaceholder")} onChange={(event) => setName(event.target.value)} />
              <Button type="submit" disabled={pending} className="h-10">
                {t("createAndAdd")}
              </Button>
            </div>
          </form>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
