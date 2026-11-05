"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RealtimeBridge = dynamic(
 () =>
 import("@/components/providers/realtime-bridge").then((m) => m.RealtimeBridge),
 { ssr: false },
);

const WishlistSync = dynamic(
 () =>
 import("@/components/providers/wishlist-sync").then((m) => m.WishlistSync),
 { ssr: false },
);

const CompareSync = dynamic(
 () =>
 import("@/components/providers/compare-sync").then((m) => m.CompareSync),
 { ssr: false },
);

const RecentSync = dynamic(
 () =>
 import("@/components/providers/recent-sync").then((m) => m.RecentSync),
 { ssr: false },
);

export function DeferredRealtime() {
 const [ready, setReady] = useState(false);

 useEffect(() => {
 let done = false;
 let idleId = 0;
 const enable = () => {
 if (done) return;
 done = true;
 setReady(true);
 };
 // Prefer idle after first paint; fallback timeout keeps sync eventually.
 const ric = (
 window as Window & {
 requestIdleCallback?: (
 cb: () => void,
 opts?: { timeout: number },
 ) => number;
 cancelIdleCallback?: (id: number) => void;
 }
 ).requestIdleCallback;
 if (typeof ric === "function") {
 idleId = ric(enable, { timeout: 5000 });
 } else {
 idleId = window.setTimeout(enable, 4000);
 }
 window.addEventListener("pointerdown", enable, { once: true, passive: true });
 window.addEventListener("keydown", enable, { once: true });
 return () => {
 (
 window as Window & { cancelIdleCallback?: (id: number) => void }
 ).cancelIdleCallback?.(idleId);
 window.clearTimeout(idleId);
 window.removeEventListener("pointerdown", enable);
 window.removeEventListener("keydown", enable);
 };
 }, []);

 if (!ready) return null;
 return (
 <>
 <RealtimeBridge />
 <WishlistSync />
 <CompareSync />
 <RecentSync />
 </>
 );
}
