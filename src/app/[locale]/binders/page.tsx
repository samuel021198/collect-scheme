import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BinderCreate } from "@/components/binder-create";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/locale";
import { currentUser } from "@/lib/auth";
import { listBinders } from "@/lib/binders";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "binder" });
  return { title: t("title") };
}

export default async function BindersPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login?next=/binders`);
  const t = await getTranslations("binder");
  const binders = await listBinders(user.id);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("private")}</p>
      </div>
      <BinderCreate />
      {binders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {binders.map((binder) => (
            <Link key={binder.id} href={`/binders/${binder.id}`} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50">
              <h2 className="font-display text-xl">{binder.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{binder.layout.replace("x", "×")} · {t("filled", { count: binder.filled })}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
