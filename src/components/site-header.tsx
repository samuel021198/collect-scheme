import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeaderChrome } from "./header-chrome";

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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <HeaderChrome
        logo={
          <Link href="/" className="font-display flex items-center gap-2 text-xl tracking-tight text-foreground">
            <Mark />
            Collect Scheme
          </Link>
        }
      />
    </header>
  );
}
