"use client";

import { Mail } from "lucide-react";
import { Footer } from "@/components/ui/modem-animated-footer";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <Footer
      brandDescription="فروشگاه تخصصی اکسسوری دست ساز"
      watermarkName="ShadJewel"
      socialLinks={[
        {
          icon: <Mail className="h-6 w-6" />,
          href: "mailto:info@shadjewel.ir",
          label: "ایمیل",
        },
      ]}
      navLinks={[
        { label: "درباره ما", href: "/درباره-ما" },
        { label: "راهنمای سایز", href: "/راهنمای-سایز" },
        { label: "ارسال", href: "/ارسال" },
        { label: "مرجوعی", href: "/مرجوعی" },
        { label: "ضمانت و اصالت", href: "/ضمانت" },
        { label: "سوالات متداول", href: "/سوالات-متداول" },
        { label: "شرایط استفاده", href: "/شرایط-استفاده" },
        { label: "حریم خصوصی", href: "/حریم-خصوصی" },
        { label: "تماس", href: "/تماس" },
      ]}
      brandIcon={
        <Logo variant="mark" size="footer" className="pointer-events-none" />
      }
    />
  );
}
