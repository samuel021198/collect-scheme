import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PrintLang, SearchKind } from "@/lib/catalog";
import { cn } from "cn";

const pill =
  "inline-flex cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring";

export async function SearchBar({
  locale,
  q = "",
  lang = "en",
  kind = "card",
  idPrefix = "search",
}: {
  locale: string;
  q?: string;
  lang?: PrintLang;
  kind?: SearchKind;
  idPrefix?: string;
}) {
  const t = await getTranslations("search");
  const placeholder = kind === "set" ? t("placeholderSet") : t("placeholderCard");

  return (
    <form
      key={`${lang}-${kind}-${q}`}
      action={`/${locale}/encyclopedia`}
      className="grid max-w-2xl gap-4 rounded-2xl border border-border bg-card p-4"
    >
      <fieldset className="grid gap-2">
        <legend className="text-xs text-muted-foreground">{t("lang")}</legend>
        <div className="flex flex-wrap gap-2">
          {(["en", "ja"] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="lang"
                value={value}
                defaultChecked={lang === value}
                className="peer sr-only"
              />
              <span className={pill}>{t(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-xs text-muted-foreground">{t("what")}</legend>
        <div className="flex flex-wrap gap-2">
          {(["card", "set"] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="kind"
                value={value}
                defaultChecked={kind === value}
                className="peer sr-only"
              />
              <span className={pill}>{t(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Label htmlFor={`${idPrefix}-q`} className="sr-only">
          {t("what")}
        </Label>
        <Input
          id={`${idPrefix}-q`}
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="h-11 sm:flex-1"
        />
        <button type="submit" className={cn(buttonVariants(), "h-11 px-5")}>
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
