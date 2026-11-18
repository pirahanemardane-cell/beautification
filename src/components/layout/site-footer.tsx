"use client";

import StrobeDivaFooter from "@/components/ui/strobe-diva-footer";
import { STOREFRONT_PATHS } from "@/lib/seo/storefront-paths";

const FOOTER_COLUMNS = [
  {
    title: "فروشگاه",
    links: [
      { label: "محصولات", href: STOREFRONT_PATHS.products },
      { label: "دسته‌ها", href: STOREFRONT_PATHS.categories },
      { label: "درباره ما", href: STOREFRONT_PATHS.about },
      { label: "تماس", href: STOREFRONT_PATHS.contact },
    ],
  },
  {
    title: "راهنما",
    links: [
      { label: "راهنمای سایز", href: STOREFRONT_PATHS.sizeGuide },
      { label: "ارسال", href: STOREFRONT_PATHS.shipping },
      { label: "مرجوعی", href: STOREFRONT_PATHS.returns },
      { label: "ضمانت و اصالت", href: STOREFRONT_PATHS.warranty },
      { label: "سوالات متداول", href: STOREFRONT_PATHS.faq },
    ],
  },
  {
    title: "قانونی",
    links: [
      { label: "شرایط استفاده", href: STOREFRONT_PATHS.terms },
      { label: "حریم خصوصی", href: STOREFRONT_PATHS.privacy },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "شرایط استفاده", href: STOREFRONT_PATHS.terms },
  { label: "حریم خصوصی", href: STOREFRONT_PATHS.privacy },
];

export function SiteFooter() {
  return (
    <StrobeDivaFooter
      wordmark="SHADJEWEL"
      mark="S"
      sealText="Shad Jewel · اکسسوری شاد ·"
      established="2024"
      barcode="14030118"
      preset="shadjewel"
      figure={null}
      columns={FOOTER_COLUMNS}
      legalLinks={LEGAL_LINKS}
      copyright="© شاد جول"
      labels={{
        established: "تأسیس",
        backToTop: "بالا",
        replay: "پخش دوباره",
      }}
      fontFamily='"IRANYekanX", Impact, Haettenschweiler, "Arial Narrow", sans-serif'
      monoFamily='"IRANYekanX", "JetBrains Mono", Menlo, Consolas, monospace'
      backToTop
    />
  );
}
