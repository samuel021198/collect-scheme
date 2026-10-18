import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutButton } from "./logout-button";
import { NavLinks } from "./nav-links";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 text-primary" aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M16 6.5c1.8 3.2 1.6 5.4-.2 8.2 3.2-.8 6.2.4 7.2 3.4-3.2.8-5.2 3.8-7 7.4-1.8-3.6-3.8-6.6-7-7.4 1-3 4-4.2 7.2-3.4-1.8-2.8-2-5-.2-8.2Z"
        fill="#24180a"
      />
    </svg>
  );
}

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const user = await currentUser();
  const items = [
    { href: "/encyclopedia", label: t("encyclopedia") },
    { href: "/sets", label: t("sets") },
    { href: "/shops", label: t("shops") },
    ...(user ? [{ href: "/binders", label: t("binders") }] : []),
    { href: "/trade", label: t("trade") },
    { href: "/auction", label: t("auction"), quiet: true },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-display flex items-center gap-2 text-xl tracking-tight text-foreground">
            <Mark />
            Collect Scheme
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="max-w-32 truncate text-sm text-muted-foreground">{user.name}</span>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="rounded-full border border-border px-3 py-1.5 text-sm">
                {t("login")}
              </Link>
            )}
            <Suspense fallback={<div className="h-8 w-24 rounded-full bg-muted" />}>
              <LanguageSwitcher />
            </Suspense>
          </div>
        </div>
        <NavLinks items={items} label={t("primary")} />
      </div>
    </header>
  );
}
