import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const locale = url.pathname.split("/").filter(Boolean)[0];
  if (url.searchParams.get("kind") === "set" && (locale === "zh" || locale === "en") && url.pathname === `/${locale}/encyclopedia`) {
    const dest = url.clone();
    dest.pathname = `/${locale}/sets`;
    dest.searchParams.delete("kind");
    if (dest.searchParams.get("lang") !== "ja") dest.searchParams.delete("lang");
    return NextResponse.redirect(dest);
  }
  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
