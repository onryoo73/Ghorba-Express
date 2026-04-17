import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const config = {
  // Match all paths except static files and api
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)"],
};
