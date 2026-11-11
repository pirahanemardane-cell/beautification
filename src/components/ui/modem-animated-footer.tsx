"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

interface FooterProps {
  brandDescription?: string;
  /** Large faint English background watermark (outside the box) */
  watermarkName?: string;
  socialLinks?: SocialLink[];
  navLinks?: FooterLink[];
  creatorName?: string;
  creatorUrl?: string;
  /** Lower in-box brand mark only */
  brandIcon?: React.ReactNode;
  className?: string;
}

export function Footer({
  brandDescription = "فروشگاه تخصصی اکسسوری دست ساز — رسمی، اسپرت، دستبند، ست و اکسسوری",
  watermarkName = "ShadJewel",
  socialLinks = [],
  navLinks = [],
  creatorName,
  creatorUrl,
  brandIcon,
  className,
}: FooterProps) {
  void creatorName;
  void creatorUrl;

  return (
    <section className={cn("relative mt-0 w-full overflow-x-clip", className)}>
      <footer className="border-t bg-background relative mt-20 overflow-hidden">
        <div className="relative mx-auto flex min-h-[20rem] w-full max-w-7xl flex-col justify-between p-4 py-8 sm:min-h-[22rem] md:min-h-[24rem] md:py-10">
          <div className="mb-8 flex w-full flex-col sm:mb-10 md:mb-6">
            <div className="flex w-full flex-col items-center">
              <p className="text-muted-foreground max-w-4xl px-4 text-center text-sm font-semibold sm:text-base">
                {brandDescription}
              </p>

              {socialLinks.length > 0 && (
                <div className="mt-3 mb-8 flex gap-4">
                  {socialLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="h-6 w-6 duration-300 hover:scale-110">
                        {link.icon}
                      </div>
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {navLinks.length > 0 && (
                <div className="text-muted-foreground relative z-20 mx-auto grid w-full max-w-4xl grid-cols-4 gap-x-2 gap-y-2.5 px-4 pb-10 text-center text-xs font-medium sm:text-sm md:flex md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-0 md:pb-28 md:text-sm">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      className="hover:text-foreground duration-300 hover:font-semibold"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Soft fade above watermark — kept above the chip so glass can read text */}
        <div
          aria-hidden
          className="from-background via-background/50 pointer-events-none absolute inset-x-0 bottom-[7.5rem] z-0 h-16 bg-gradient-to-t to-transparent sm:bottom-32"
        />

        {/* Large faint English watermark outside the box */}
        <div
          className="text-primary/40 pointer-events-none absolute inset-x-0 bottom-6 z-[1] overflow-hidden px-3 text-center leading-none font-extrabold select-none sm:bottom-8 md:bottom-2"
          style={{
            fontSize: "clamp(1.25rem, 8.5vw, 9.5rem)",
            letterSpacing: "-0.02em",
          }}
        >
          <span className="inline-block max-w-full truncate whitespace-nowrap">
            {watermarkName}
          </span>
        </div>

        {/*
          Logo chip + side borders.
          inset-x + padding (no left-1/2/-translate-x) keeps the chip fully inside
          the footer on tablet/mobile; glass fill lets the watermark show through.
        */}
        <div
          dir="ltr"
          className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-3 sm:bottom-7 sm:px-4 md:bottom-9"
        >
          <div className="flex w-full max-w-xl items-center md:max-w-3xl lg:max-w-4xl">
            <div className="bg-gradient-to-r from-transparent to-primary/70 h-px min-w-0 flex-1" />
            <div
              className={cn(
                "pointer-events-auto relative mx-0 flex shrink-0 items-center justify-center overflow-hidden",
                "h-16 w-16 rounded-2xl p-1.5 sm:h-20 sm:w-20 sm:p-2 md:h-24 md:w-24 md:p-2.5",
                /* Colorless matte frosted glass — white/neutral only, no coral/peach tint */
                "border border-white/55 bg-white/40 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.18)]",
                "backdrop-blur-xl backdrop-saturate-100",
                "supports-[backdrop-filter]:bg-white/25",
                "transition-colors duration-300 hover:border-white/70"
              )}
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden [&_a]:!h-full [&_a]:!w-full [&_img]:!h-full [&_img]:!w-full">
                {brandIcon}
              </div>
            </div>
            <div className="bg-gradient-to-l from-transparent to-primary/70 h-px min-w-0 flex-1" />
          </div>
        </div>
      </footer>
    </section>
  );
}
