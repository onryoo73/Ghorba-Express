import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "never", // Don't add locale to URL
  localeDetection: true,
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|static|.*\\..*).*)"],
};
