import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeaderChrome } from "./header-chrome";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <HeaderChrome
        logo={
          <Link href="/" className="text-base font-semibold text-foreground">
            Collect Scheme
          </Link>
        }
      />
    </header>
  );
}
