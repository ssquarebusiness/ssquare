import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { routing, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { SiteHeader } from "@/components/public/header";
import { SiteFooter } from "@/components/public/footer";
import { MobileCTA } from "@/components/public/mobile-cta";
import { BusinessJsonLd } from "@/features/public/sections/json-ld";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.legalName, template: `%s` },
  applicationName: siteConfig.name,
  formatDetection: { telephone: false },
  other: { "geo.region": "IN-GJ", "geo.placename": "Nadiad", "geo.position": `${siteConfig.geo.lat};${siteConfig.geo.lng}` },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Root layout of the public website (English at "/", Gujarati at "/gu", Hindi at "/hi"). */
export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <MobileCTA />
        </NextIntlClientProvider>
        <BusinessJsonLd locale={locale as Locale} />
      </body>
    </html>
  );
}
