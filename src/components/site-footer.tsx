import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl">Collect Scheme · {t("rights")}</p>
        <p>{t("p2p")}</p>
      </div>
    </footer>
  );
}
