import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "راهنمای انتخاب | بیوتی‌فیکیشن",
  description:
    "راهنمای کوتاه انتخاب محصول مراقبت پوست، مو و بهداشت بر اساس نوع پوست",
};

const SKIN_ROWS = [
  { type: "خشک", pick: "کرم آبرسان و لوسیون", avoid: "شوینده قوی" },
  { type: "چرب", pick: "ژل شستشو و سرم سبک", avoid: "کرم سنگین" },
  { type: "مختلط", pick: "مرطوب‌کننده متعادل", avoid: "لایه‌بردار روزانه" },
  { type: "حساس", pick: "محصول بدون عطر", avoid: "اسید قوی" },
  { type: "معمولی", pick: "ضدآفتاب و شوینده ملایم", avoid: "—" },
] as const;

export default function SizeGuidePage() {
  return (
    <StaticPage title="راهنمای انتخاب">
      <p className="text-muted-foreground mb-8 leading-relaxed">
        نوع پوست و نگرانی پوست را از فیلتر محصولات انتخاب کنید. جدول زیر فقط
        نقطه شروع است؛ جزئیات هر کالا روی صفحه محصول اولویت دارد.
      </p>
      <div className="table-scroll border-border mb-8 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[22rem] text-center text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2.5">نوع پوست</th>
              <th className="p-2.5">شروع مناسب</th>
              <th className="p-2.5">با احتیاط</th>
            </tr>
          </thead>
          <tbody>
            {SKIN_ROWS.map((r) => (
              <tr key={r.type} className="border-border border-t">
                <td className="p-2.5 font-medium">{r.type}</td>
                <td className="p-2.5">{r.pick}</td>
                <td className="text-muted-foreground p-2.5">{r.avoid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        عطر و محصولات بهداشتی را جدا از روتین پوست انتخاب کنید. در صورت حساسیت،
        استفاده را قطع و با پشتیبانی هماهنگ کنید.
      </p>
    </StaticPage>
  );
}
