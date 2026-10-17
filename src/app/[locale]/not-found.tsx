import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="grid max-w-lg gap-3 py-16">
      <h1 className="font-display text-4xl">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <Link href="/" className="text-sm text-primary">
        {t("home")}
      </Link>
    </div>
  );
}
