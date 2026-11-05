import type { Metadata } from "next";
import { StaticPage } from "@/components/content/static-page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "راهنمای سایز | اکسسوری شاد",
  description:
    "جدول استاندارد سایز انگشتر، گردنبند و دستبند مطابق استاندارد ایران و بین‌المللی",
};

/** سایز انگشتر — استاندارد ایران (محیط داخلی = ISO/EU) + قطر + US */
const RING_ROWS = [
  { ir: "48", diameter: "15.3", us: "4.5" },
  { ir: "50", diameter: "15.9", us: "5.5" },
  { ir: "52", diameter: "16.5", us: "6" },
  { ir: "54", diameter: "17.2", us: "7" },
  { ir: "56", diameter: "17.8", us: "8" },
  { ir: "58", diameter: "18.5", us: "8.5" },
  { ir: "60", diameter: "19.1", us: "9.5" },
  { ir: "62", diameter: "19.7", us: "10.5" },
  { ir: "64", diameter: "20.4", us: "11.5" },
  { ir: "66", diameter: "21.0", us: "12.5" },
] as const;

/** گردنبند — طول استاندارد بین‌المللی (cm) */
const NECKLACE_ROWS = [
  { length: "35–40", name: "چوکر (Choker)", place: "چسبیده به پایه گردن" },
  { length: "40–45", name: "پرنسس (Princess)", place: "روی ترقوه — رایج‌ترین" },
  { length: "45–50", name: "ماتینه کوتاه", place: "کمی زیر ترقوه" },
  { length: "50–55", name: "ماتینه (Matinee)", place: "بین ترقوه و سینه" },
  { length: "60–70", name: "اپرا (Opera)", place: "زیر سینه / چندلایه" },
] as const;

/** دستبند — دور مچ → طول پیشنهادی (استاندارد زنانه/مردانه) */
const BRACELET_ROWS = [
  { wrist: "14–15", length: "16", note: "مچ باریک / نوجوان" },
  { wrist: "15–16.5", length: "17–18", note: "استاندارد خانم‌ها" },
  { wrist: "16.5–18", length: "18–19", note: "مچ متوسط تا بزرگ خانم‌ها" },
  { wrist: "18–19.5", length: "19–20", note: "استاندارد آقایان" },
  { wrist: "19.5–21", length: "20–21", note: "مچ بزرگ آقایان" },
] as const;

export default function SizeGuidePage() {
  return (
    <StaticPage title="راهنمای سایز">
      <p className="text-muted-foreground mb-8 leading-relaxed">
        جداول زیر بر اساس استاندارد رایج بازار ایران (شماره محیط داخلی به میلی‌متر)
        و استاندارد بین‌المللی ISO تهیه شده‌اند. برای انتخاب دقیق‌تر، اندازه‌گیری را
        در دمای اتاق و بعدازظهر انجام دهید.
      </p>

      {/* —— انگشتر —— */}
      <h2 className="mb-3 text-lg font-bold">سایز انگشتر</h2>
      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
        سایز ایران همان محیط داخلی حلقه به میلی‌متر است (مشابه EU/ISO).
        قطر داخلی را با خط‌کش از یک انگشتر مناسب اندازه بگیرید، یا دور انگشت را
        با نوار کاغذی اندازه گرفته و با ستون محیط مقایسه کنید.
        سایزهای رایج خانم‌ها معمولاً ۵۰ تا ۵۶ و آقایان ۵۸ تا ۶۴ است.
      </p>
      <div className="table-scroll border-border mb-10 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[20rem] text-center text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2.5">سایز ایران</th>
              <th className="p-2.5">قطر داخلی (mm)</th>
              <th className="p-2.5">معادل US</th>
            </tr>
          </thead>
          <tbody>
            {RING_ROWS.map((r) => (
              <tr key={r.ir} className="border-border border-t">
                <td className="p-2.5 font-medium tabular-nums">{r.ir}</td>
                <td className="p-2.5 tabular-nums">{r.diameter}</td>
                <td className="p-2.5 tabular-nums">{r.us}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* —— گردنبند —— */}
      <h2 className="mb-3 text-lg font-bold">طول گردنبند</h2>
      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
        طول زنجیر را از یک سر قفل تا سر دیگر اندازه بگیرید. اعداد زیر استاندارد
        رایج فروشگاه‌های بین‌المللی و ایران است.
      </p>
      <div className="table-scroll border-border mb-10 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[24rem] text-center text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2.5">طول (cm)</th>
              <th className="p-2.5">نام رایج</th>
              <th className="p-2.5">محل قرارگیری</th>
            </tr>
          </thead>
          <tbody>
            {NECKLACE_ROWS.map((r) => (
              <tr key={r.length} className="border-border border-t">
                <td className="p-2.5 font-medium tabular-nums">{r.length}</td>
                <td className="p-2.5">{r.name}</td>
                <td className="p-2.5 text-muted-foreground">{r.place}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* —— دستبند —— */}
      <h2 className="mb-3 text-lg font-bold">سایز دستبند</h2>
      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
        دور مچ را درست بالای استخوان مچ اندازه بگیرید (نه خیلی سفت). برای فیت
        راحت معمولاً ۱ تا ۲ سانتی‌متر به دور مچ اضافه می‌شود تا طول دستبند به‌دست آید.
      </p>
      <div className="table-scroll border-border mb-8 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[22rem] text-center text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2.5">دور مچ (cm)</th>
              <th className="p-2.5">طول دستبند (cm)</th>
              <th className="p-2.5">توضیح</th>
            </tr>
          </thead>
          <tbody>
            {BRACELET_ROWS.map((r) => (
              <tr key={r.wrist} className="border-border border-t">
                <td className="p-2.5 font-medium tabular-nums">{r.wrist}</td>
                <td className="p-2.5 tabular-nums">{r.length}</td>
                <td className="p-2.5 text-muted-foreground">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        اگر بین دو سایز بودید معمولاً سایز بزرگ‌تر راحت‌تر است. برای حلقه‌های پهن
        (بیش از ۶ میلی‌متر) نیم تا یک سایز بزرگ‌تر پیشنهاد می‌شود. جزئیات هر محصول
        روی صفحه کالا اولویت دارد؛ در صورت تردید با پشتیبانی هماهنگ کنید.
      </p>
    </StaticPage>
  );
}
