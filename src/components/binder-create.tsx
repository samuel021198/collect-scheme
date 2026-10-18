"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BinderCreate() {
  const t = useTranslations("binder");
  const account = useTranslations("account");
  const router = useRouter();
  const [name, setName] = useState("");
  const [layout, setLayout] = useState("3x3");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid max-w-xl gap-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        void fetch("/api/binders", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, layout }),
        })
          .then(async (response) => {
            const payload = (await response.json()) as { id?: string; error?: string };
            if (!response.ok || !payload.id) {
              setError(payload.error === "name" ? t("errName") : account("err_generic"));
              setPending(false);
              return;
            }
            router.push(`/binders/${payload.id}`);
            router.refresh();
          })
          .catch(() => {
            setError(account("err_generic"));
            setPending(false);
          });
      }}
    >
      <Label htmlFor="binder-name">{t("new")}</Label>
      <Input id="binder-name" value={name} placeholder={t("namePlaceholder")} onChange={(event) => setName(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        {["3x3", "4x3", "4x4"].map((value) => (
          <Button key={value} type="button" size="sm" variant={layout === value ? "default" : "outline"} onClick={() => setLayout(value)}>
            {value.replace("x", "×")}
          </Button>
        ))}
      </div>
      <Button type="submit" disabled={pending} className="h-10 w-fit">{t("create")}</Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
