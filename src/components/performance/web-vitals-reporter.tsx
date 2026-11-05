"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SpeedInsights = dynamic(
 () =>
 import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
 { ssr: false },
);

type Metric = {
 name: string;
 value: number;
 id: string;
 rating?: string;
 delta?: number;
 navigationType?: string;
};

function sendToApi(metric: Metric) {
 const body = JSON.stringify({
 name: metric.name,
 value: metric.value,
 id: metric.id,
 rating: metric.rating,
 delta: metric.delta,
 navigationType: metric.navigationType,
 path: typeof window !== "undefined" ? window.location.pathname : "",
 });
 try {
 if (typeof navigator !== "undefined" && navigator.sendBeacon) {
 const blob = new Blob([body], { type: "application/json" });
 navigator.sendBeacon("/api/vitals", blob);
 return;
 }
 } catch {
 /* fall through */
 }
 void fetch("/api/vitals", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body,
 keepalive: true,
 }).catch(() => {});
}

function runWhenIdle(cb: () => void, timeout = 4000) {
 if (typeof window === "undefined") return () => {};
 let id = 0;
 const ric = (
 window as Window & {
 requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
 cancelIdleCallback?: (id: number) => void;
 }
 ).requestIdleCallback;
 if (typeof ric === "function") {
 id = ric(cb, { timeout });
 return () =>
 (
 window as Window & { cancelIdleCallback?: (id: number) => void }
 ).cancelIdleCallback?.(id);
 }
 id = window.setTimeout(cb, Math.min(timeout, 1500));
 return () => window.clearTimeout(id);
}

/**
 * جمع‌آوری CWV در production + Vercel Speed Insights
 * Deferred until idle so third-party script does not contend with LCP/INP.
 */
export function WebVitalsReporter() {
 const [ready, setReady] = useState(false);

 useEffect(() => {
 let cancelled = false;
 const stopIdle = runWhenIdle(() => {
 if (!cancelled) setReady(true);
 });

 void (async () => {
 try {
 // Defer web-vitals listeners slightly so first input/paint win the race.
 await new Promise<void>((resolve) => {
 runWhenIdle(() => resolve(), 2500);
 });
 if (cancelled) return;
 const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import("web-vitals");
 if (cancelled) return;
 const report = (m: Metric) => sendToApi(m);
 onCLS(report);
 onINP(report);
 onLCP(report);
 onFCP(report);
 onTTFB(report);
 } catch (e) {
 console.warn("[web-vitals]", e);
 }
 })();

 return () => {
 cancelled = true;
 stopIdle();
 };
 }, []);

 if (!ready) return null;
 return <SpeedInsights />;
}
