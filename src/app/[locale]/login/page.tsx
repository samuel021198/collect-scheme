import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth-form";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/password";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string | string[] }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const mode = one((await searchParams).mode) === "register" ? "registerTitle" : "loginTitle";
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t(mode) };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string | string[]; next?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const raw = await searchParams;
  const mode = one(raw.mode) === "register" ? "register" : "login";
  const next = safeNext(one(raw.next));
  const t = await getTranslations("account");
  const user = await currentUser();
  if (user) redirect(`/${locale}${next}`);

  return (
    <div className="grid max-w-md gap-4">
      <h1 className="font-display text-4xl">{mode === "register" ? t("registerTitle") : t("loginTitle")}</h1>
      <AuthForm mode={mode} next={next} />
    </div>
  );
}
