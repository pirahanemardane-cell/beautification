import type { Metadata } from "next";
import { About3 } from "@/components/ui/about-3";

export const metadata: Metadata = {
 title: "درباره ما | بیوتی‌فیکیشن",
 description:
 "فروشگاه آرایشی و بهداشتی — مراقبت پوست، آرایش، مو، بدن، عطر و بهداشت",
};

export default function AboutPage() {
 return (
 <About3
 title="درباره بیوتی‌فیکیشن"
 description="بیوتی‌فیکیشن فروشگاه آرایشی و بهداشتی است. روی محصولات مراقبت پوست، آرایش و بهداشت روزمره تمرکز داریم — از انتخاب تا پشتیبانی پس از خرید."
 breakout={{
 src: "",
 alt: "بیوتی‌فیکیشن",
 title: "آرایشی و بهداشتی",
 description:
 "مراقبت پوست، آرایش، مو، بدن، عطر و بهداشت — با فیلتر نوع پوست و پشتیبانی واقعی.",
 buttonText: "مشاهده محصولات",
 buttonUrl: "/محصولات",
 }}
 companiesTitle="تمرکز ما"
 companies={[]}
 achievementsTitle="آنچه برای شما می‌چینیم"
 achievementsDescription="فروشگاه تخصصی، نه همه‌چیزفروشی."
 achievements={[
 { label: "تمرکز", value: "آرایشی و بهداشتی" },
 { label: "دسته‌ها", value: "شش دسته" },
 { label: "مرجوعی", value: "آسان" },
 { label: "پشتیبانی", value: "واقعی" },
 ]}
 />
 );
}
