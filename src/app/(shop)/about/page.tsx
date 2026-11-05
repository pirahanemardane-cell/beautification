import type { Metadata } from "next";
import { About3 } from "@/components/ui/about-3";

export const metadata: Metadata = {
 title: "درباره ما | جواهر شاد",
 description:
 "فروشگاه تخصصی اکسسوری دست‌ساز — گردنبند، گوشواره، انگشتر، دستبند و ست",
};

export default function AboutPage() {
 return (
 <About3
 title="درباره جواهر شاد"
 description="جواهر شاد فروشگاه تخصصی اکسسوری دست‌ساز است. روی طراحی تمیز، مواد باکیفیت و تجربه خرید شفاف تمرکز داریم — از انتخاب تا پشتیبانی پس از خرید."
 breakout={{
 src: "/brand/logo-light-transparent.webp",
 alt: "جواهر شاد",
 title: "اکسسوری دست‌ساز",
 description:
 "گردنبند، گوشواره، انگشتر و دستبند — با راهنمای سایز شفاف و پشتیبانی واقعی.",
 buttonText: "مشاهده محصولات",
 buttonUrl: "/products",
 }}
 companiesTitle="تمرکز ما"
 companies={[]}
 achievementsTitle="آنچه برای شما می‌سازیم"
 achievementsDescription="فروشگاه تخصصی، نه همه‌چیزفروشی."
 achievements={[
 { label: "تمرکز", value: "اکسسوری دست‌ساز" },
 { label: "ساخت", value: "دست‌ساز" },
 { label: "مرجوعی", value: "آسان" },
 { label: "پشتیبانی", value: "واقعی" },
 ]}
 />
 );
}
