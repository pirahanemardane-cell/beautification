import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeBelowFold } from "@/components/home/home-below-fold";
import PolaroidLineCarousel from "@/components/ui/polaroid-line-carousel";

// ISR: HTML کش‌شده ۶۰ ثانیه
export const revalidate = 60;

export const metadata: Metadata = {
  title: "اکسسوری شاد | فروشگاه تخصصی اکسسوری دست ساز",
  description:
    "خرید گردنبند، گوشواره، انگشتر، دستبند و ست‌های اکسسوری دست ساز از فروشگاه تخصصی اکسسوری دست ساز",
};

const HERO_SLIDES = [
  {
    image: "/hero/polaroid-earring.webp",
    alt: "گوشواره دست‌ساز",
  },
  {
    image: "/hero/polaroid-01.webp",
    alt: "اکسسوری دست‌ساز",
  },
  {
    image: "/hero/polaroid-02.webp",
    alt: "جواهرات دست‌ساز",
  },
] as const;

/** Early LCP hints — first polaroid image for the carousel. */
function HomeHeroPreloads() {
  return (
    <link
      rel="preload"
      as="image"
      href="/hero/polaroid-earring.webp"
      type="image/webp"
    />
  );
}

/**
 * Sync shell: polaroid carousel streams in the first paint.
 * Catalog/DB sections suspend separately so layout footer cannot win the race.
 */
export default function HomePage() {
  return (
    <>
      <HomeHeroPreloads />
      <PolaroidLineCarousel
        showChrome={false}
        slides={[...HERO_SLIDES]}
        height="100svh"
        background="#F8F9FA"
        ariaLabel="گالری عکس محصولات"
      />
      <Suspense fallback={null}>
        <HomeBelowFold />
      </Suspense>
    </>
  );
}
