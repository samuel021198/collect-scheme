import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PrintLang } from "@/lib/catalog";
import { cn } from "cn";

const pill =
  "inline-flex cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring";

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
  const title = mode === "set" ? t("setTitle") : t("cardTitle");
  const hint = mode === "set" ? t("setHint") : t("cardHint");
  const placeholder = mode === "set" ? t("placeholderSet") : t("placeholderCard");

  return (
    <form
      key={`${mode}-${lang}-${q}`}
      action={action}
      className="grid gap-4 rounded-2xl border border-border bg-card p-4"
    >
      {heading ? (
        <div className="grid gap-1">
          <h2 className="font-display text-2xl">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
        </div>
      ) : null}
      {showLang ? (
        <fieldset className="grid gap-2">
          <legend className="text-xs text-muted-foreground">{t("lang")}</legend>
          <div className="flex flex-wrap gap-2">
            {(["en", "ja"] as const).map((value) => (
              <label key={value}>
                <input type="radio" name="lang" value={value} defaultChecked={lang === value} className="peer sr-only" />
                <span className={pill}>{t(value)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="lang" value={lang} />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Label htmlFor={`${idPrefix}-q`} className="sr-only">
          {title}
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
