import type { Metadata } from "next";
import { About3 } from "@/components/ui/about-3";

export const metadata: Metadata = {
 title: "درباره ما | اکسسوری شاد",
 description:
 "فروشگاه تخصصی اکسسوری دست‌ساز — گردنبند، گوشواره، انگشتر، دستبند و ست",
};

export default function AboutPage() {
 return (
 <About3
 title="درباره اکسسوری شاد"
 description="اکسسوری شاد فروشگاه تخصصی اکسسوری دست‌ساز است. روی طراحی تمیز، مواد باکیفیت و تجربه خرید شفاف تمرکز داریم — از انتخاب تا پشتیبانی پس از خرید."
 breakout={{
 src: "",
 alt: "اکسسوری شاد",
 title: "اکسسوری دست‌ساز",
 description:
 "گردنبند، گوشواره، انگشتر و دستبند — با راهنمای سایز شفاف و پشتیبانی واقعی.",
 buttonText: "مشاهده محصولات",
 buttonUrl: "/محصولات",
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
