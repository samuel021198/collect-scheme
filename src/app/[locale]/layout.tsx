import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { NickProvider } from "@/components/nick";
import { QuickAddProvider } from "@/components/quick-add";
import { resolveLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const preferredRegion = "hkg1";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: "Collect Scheme", template: "%s · Collect Scheme" },
    description: t("homeDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const messages = await getMessages();

  return (
    <html lang={locale === "zh" ? "zh-Hant" : "en"} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <NickProvider>
            <QuickAddProvider>
              <SiteHeader />
              <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-8">
                {children}
              </main>
              <SiteFooter />
            </QuickAddProvider>
          </NickProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
