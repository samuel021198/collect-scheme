import { getRequestConfig } from "next-intl/server";
import { isLocale, routing } from "./routing";

const catalogs = {
  en: () => import("../../messages/en.json"),
  zh: () => import("../../messages/zh.json"),
  // ja: () => import("../../messages/ja.json"),
  // "zh-Hans": () => import("../../messages/zh-Hans.json"),
} as const;

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const requested = locale ?? (await requestLocale);
  const resolved =
    requested && isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await catalogs[resolved]()).default,
  };
});
