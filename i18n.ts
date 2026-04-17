import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is supported
  const validLocale = locales.find((l) => l === locale) ?? defaultLocale;
  if (validLocale !== locale) {
    notFound();
  }

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
    timeZone: "Africa/Tunis",
  };
});
