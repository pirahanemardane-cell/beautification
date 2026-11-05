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
      <link rel="preload" as="image" href="/hero/hero-poster.jpg" type="image/jpeg" />
      <link rel="preload" as="image" href="/hero/frames/frame-001.jpg" type="image/jpeg" />
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
