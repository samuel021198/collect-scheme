import { getTranslations } from "next-intl/server";
import { SearchForm } from "@/components/search-form";
import type { PrintLang } from "@/lib/catalog";

export async function SearchBar({
  locale,
  q = "",
  lang = "en",
  mode,
  idPrefix,
  heading = false,
  showLang = true,
}: {
  locale: string;
  q?: string;
  lang?: PrintLang;
  mode: "card" | "set";
  idPrefix: string;
  heading?: boolean;
  showLang?: boolean;
}) {
  const t = await getTranslations("search");
  const action = mode === "set" ? `/${locale}/sets` : `/${locale}/encyclopedia`;

  return (
    <SearchForm
      locale={locale}
      q={q}
      lang={lang}
      mode={mode}
      idPrefix={idPrefix}
      heading={heading}
      showLang={showLang}
      action={action}
      title={mode === "set" ? t("setTitle") : t("cardTitle")}
      hint={mode === "set" ? t("setHint") : t("cardHint")}
      placeholder={mode === "set" ? t("placeholderSet") : t("placeholderCard")}
      submit={t("submit")}
      langLabel={t("lang")}
      english={t("en")}
      japanese={t("ja")}
      cardsLabel={t("suggestCards")}
      setsLabel={t("suggestSets")}
      emptyLabel={t("suggestEmpty")}
    />
  );
}
