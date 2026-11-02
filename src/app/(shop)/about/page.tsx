import type { Metadata } from "next";
import { About3 } from "@/components/ui/about-3";

export const metadata: Metadata = {
 title: "درباره ما | جواهر شاد",
 description:
 "فروشگاه تخصصی زیورآلات و اکسسوری — کیفیت دوخت، راهنمای سایز زیورآلات شفاف و پشتیبانی واقعی",
};

export default function AboutPage() {
 return (
 <About3
 title="درباره جواهر شاد"
 description="ما روی یک چیز تمرکز کرده‌ایم: جواهر شاد با فیت درست، دوخت تمیز و تجربه خرید شفاف. هدفمان این است که قبل از خرید سایز را با اطمینان انتخاب کنید و بعد از خرید پشتیبانی واقعی داشته باشید."
 breakout={{
 src: "/logo.png",
 alt: "جواهر شاد",
 title: "اندازه درست، استایل درست",
 description:
 "راهنمای سایز زیورآلات شفاف، تعویض آسان و پشتیبانی واقعی — برای اطمینان از فیت قبل و بعد از خرید.",
 buttonText: "مشاهده محصولات",
 buttonUrl: "/products",
 }}
 companiesTitle="تمرکز ما"
 companies={[]}
 achievementsTitle="آنچه برای شما می‌سازیم"
 achievementsDescription="فروشگاه تخصصی، نه همه‌چیزفروشی."
 achievements={[
 { label: "تمرکز", value: "زیورآلات" },
 { label: "فیت", value: "دقیق" },
 { label: "مرجوعی", value: "آسان" },
 { label: "پشتیبانی", value: "واقعی" },
 ]}
 />
 );
}
