"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const codes = ["email", "password", "name", "taken", "invalid", "unavailable", "generic"] as const;

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const register = mode === "register";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(register ? { email, password, name } : { email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        const code = codes.find((item) => item === payload.error) ?? "generic";
        setError(t(`err_${code}`));
        setPending(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError(t("err_generic"));
      setPending(false);
    }
  }

  const swap = register ? `/login?next=${encodeURIComponent(next)}` : `/login?mode=register&next=${encodeURIComponent(next)}`;

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4 rounded-2xl border border-border bg-card p-5">
      {register ? (
        <div className="grid gap-2">
          <Label htmlFor="account-name">{t("name")}</Label>
          <Input id="account-name" value={name} autoComplete="nickname" onChange={(event) => setName(event.target.value)} />
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="account-email">{t("email")}</Label>
        <Input
          id="account-email"
          type="email"
          value={email}
          autoComplete="email"
          required
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="account-password">{t("password")}</Label>
        <Input
          id="account-password"
          type="password"
          value={password}
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? t("pending") : register ? t("registerSubmit") : t("loginSubmit")}
      </Button>
      <Link href={swap} className="text-sm text-primary">
        {register ? t("toLogin") : t("toRegister")}
      </Link>
    </form>
  );
}
