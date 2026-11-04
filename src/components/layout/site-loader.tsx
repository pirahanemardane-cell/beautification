"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LumaSpin } from "@/components/ui/luma-spin";

type Ctx = { loading: boolean };
const LoaderCtx = createContext<Ctx>({ loading: false });

export function useSiteLoading() {
  return useContext(LoaderCtx);
}

/**
 * Overlay کوتاه روی اولین ورود — هدر/محتوا همیشه در DOM می‌مانند.
 * دیگر children را unmount نمی‌کند (علت تأخیر هدر).
 */
export function SiteLoaderProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // فقط یک‌بار در ورود اول سایت (نه هر ناوبری)
    if (booted) return;
    setBooted(true);
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(t);
  }, [booted]);

  // ناوبری بین صفحات: بدون بلاک کامل
  useEffect(() => {
    if (!booted) return;
    setLoading(false);
  }, [pathname, booted]);

  return (
    <LoaderCtx.Provider value={{ loading }}>
      {children}
      {loading ? (
        <div
          className="pm-site-loader pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-label="در حال بارگذاری"
        >
          <LumaSpin />
        </div>
      ) : null}
    </LoaderCtx.Provider>
  );
}
