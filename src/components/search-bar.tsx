import { getTranslations } from "next-intl/server";
import { SearchForm } from "@/components/search-form";
import { printForLocale, type PrintLang } from "@/lib/catalog";

export async function SearchBar({
  locale,
  q = "",
  lang,
  mode,
  idPrefix,
  heading = false,
}: {
  locale: string;
  q?: string;
  lang?: PrintLang;
  mode: "card" | "set";
  idPrefix: string;
  heading?: boolean;
}) {
  const t = await getTranslations("search");
  const print = lang ?? printForLocale(locale);
  const action = mode === "set" ? `/${locale}/sets` : `/${locale}/encyclopedia`;

  return (
    <SearchForm
      locale={locale}
      q={q}
      lang={print}
      mode={mode}
      idPrefix={idPrefix}
      heading={heading}
      action={action}
      title={mode === "set" ? t("setTitle") : t("cardTitle")}
      placeholder={mode === "set" ? t("placeholderSet") : t("placeholderCard")}
      submit={t("submit")}
      cardsLabel={t("suggestCards")}
      setsLabel={t("suggestSets")}
      emptyLabel={t("suggestEmpty")}
    />
  );
}
