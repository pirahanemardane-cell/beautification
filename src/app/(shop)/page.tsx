import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroScroll } from "@/components/home/hero-scroll";
import { HomeAfterHero } from "@/components/home/home-after-hero";
import { HomeBelowFold } from "@/components/home/home-below-fold";

// ISR: HTML کش‌شده ۶۰ ثانیه — هیرو دست‌نخورده
export const revalidate = 60;

export const metadata: Metadata = {
  title: "جواهر شاد | فروشگاه تخصصی اکسسوری دست ساز",
  description:
    "خرید گردنبند، گوشواره، انگشتر، دستبند و ست‌های اکسسوری دست ساز از فروشگاه تخصصی اکسسوری دست ساز",
};

/** Early LCP hints — sync page shell so these ship before catalog awaits. */
function HomeHeroPreloads() {
  return (
    <>
      {/* Single LCP candidate — mobile-first 1080w; avoid competing frame preload */}
      <link
        rel="preload"
        as="image"
        href="/hero/hero-poster-1080.webp"
        type="image/webp"
        imageSrcSet="/hero/hero-poster-1080.webp 1080w, /hero/hero-poster.webp 1440w"
        imageSizes="100vw"
      />
    </>
  );
}

/**
 * Sync shell: hero (+ LCP preloads) stream in the first paint.
 * Catalog/DB sections suspend separately so layout footer cannot win the race.
 */
export default function HomePage() {
  return (
    <>
      <HomeHeroPreloads />
      <HeroScroll />
      <HomeAfterHero>
        <Suspense fallback={null}>
          <HomeBelowFold />
        </Suspense>
      </HomeAfterHero>
    </>
  );
}
