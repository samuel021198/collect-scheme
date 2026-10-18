"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const t = useTranslations("lang");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <div className="flex rounded-full border border-border bg-card p-0.5 text-sm" role="group" aria-label={t("label")}>
      {(["en", "zh"] as const).map((code) => (
        <Link
          key={code}
          href={href}
          locale={code}
          hrefLang={code === "zh" ? "zh-Hant" : "en"}
          aria-current={locale === code ? "true" : undefined}
          className={`inline-flex min-h-10 items-center rounded-full px-3 touch-manipulation ${locale === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t(code)}
        </Link>
      ))}
    </div>
  );
}
