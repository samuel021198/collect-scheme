"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";

export function HeaderChrome({ logo }: { logo: ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [name, setName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then((response) => response.json())
      .then((body: { user?: { name?: string } | null }) => setName(body.user?.name ?? null))
      .catch(() => setName(null));
    return () => controller.abort();
  }, [pathname]);

  const items = [
    { href: "/encyclopedia", label: t("encyclopedia") },
    { href: "/sets", label: t("sets") },
    { href: "/shops", label: t("shops") },
    ...(name
      ? [
          { href: "/collection", label: t("collection") },
          { href: "/binders", label: t("binders") },
        ]
      : []),
    { href: "/trade", label: t("trade") },
    { href: "/auction", label: t("auction"), quiet: true },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {logo}
        <div className="flex items-center gap-2">
          {name ? (
            <>
              <span className="max-w-32 truncate text-sm text-muted-foreground">{name}</span>
              <LogoutButton />
            </>
          ) : name === null ? (
            <Link href="/login" className="rounded-full border border-border px-3 py-1.5 text-sm">
              {t("login")}
            </Link>
          ) : (
            <span className="h-8 w-16 rounded-full bg-muted" />
          )}
          <Suspense fallback={<div className="h-8 w-24 rounded-full bg-muted" />}>
            <LanguageSwitcher />
          </Suspense>
        </div>
      </div>
      <NavLinks items={items} label={t("primary")} />
    </div>
  );
}
