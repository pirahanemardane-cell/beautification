import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
 enabled: process.env.ANALYZE === "true"
});

const LONG_CACHE = "public, max-age=31536000, immutable";
const DAY_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
 compress: true,
 poweredByHeader: false,
 // صفحات پنل dynamic می‌مانند؛ فقط overhead کمتر

 experimental: {
 optimizePackageImports: [
 "lucide-react",
 "@radix-ui/react-icons",
 "@radix-ui/react-dropdown-menu",
 "@radix-ui/react-checkbox",
 "@radix-ui/react-label",
 "@radix-ui/react-slider",
 "@radix-ui/react-slot",
 "@radix-ui/react-tooltip",
 "@radix-ui/react-separator",
 "@radix-ui/react-navigation-menu",
 "date-fns",
 "date-fns-jalali",
 "framer-motion",
 "embla-carousel-react",
 "lucide-react",
 ],
},
 // Typed against refreshed src/types/database.ts — keep tsc clean; do not re-enable.
 typescript: { ignoreBuildErrors: false },

 async headers() {
 return [
 {
 source: "/hero/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/fonts/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/brand/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/brands/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/products/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/geo/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/_next/static/:path*",
 headers: [{ key: "Cache-Control", value: LONG_CACHE }],
 },
 {
 source: "/og-image.webp",
 headers: [{ key: "Cache-Control", value: DAY_CACHE }],
 },
 {
 source: "/favicon.ico",
 headers: [{ key: "Cache-Control", value: DAY_CACHE }],
 },
 {
 source: "/icon.png",
 headers: [{ key: "Cache-Control", value: DAY_CACHE }],
 },
 {
 source: "/icon.svg",
 headers: [{ key: "Cache-Control", value: DAY_CACHE }],
 },
 {
 source: "/apple-touch-icon.png",
 headers: [{ key: "Cache-Control", value: DAY_CACHE }],
 },
 {
 source: "/site.webmanifest",
 headers: [{ key: "Cache-Control", value: DAY_CACHE }],
 },
 {
 source: "/:path*",
 headers: [
 { key: "X-Frame-Options", value: "DENY" },
 { key: "X-Content-Type-Options", value: "nosniff" },
 {
 key: "Referrer-Policy",
 value: "strict-origin-when-cross-origin"
},
 {
 key: "Permissions-Policy",
 value: "camera=(), microphone=(), geolocation=()"
},
 {
 key: "Strict-Transport-Security",
 value: "max-age=63072000; includeSubDomains; preload"
},
 {
 key: "Content-Security-Policy",
 value: [
 "default-src 'self'",
 "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob: https://media.shadjewel.ir https://*.supabase.co https://*.r2.dev https://placehold.co",
 "font-src 'self' data:",
 "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://rest.payamak-panel.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
 "media-src 'self' https://media.shadjewel.ir",
 "object-src 'none'",
 "base-uri 'self'",
 "form-action 'self'",
 "frame-ancestors 'none'",
 "upgrade-insecure-requests",
 ].join("; ")
},
 ]
},
 ];
 },

 async rewrites() {
 return [
 { source: "/علاقه-مندی-ها", destination: "/wishlist" },
 { source: "/مقایسه", destination: "/compare" },
 { source: "/سبد-خرید", destination: "/cart" },
 { source: "/آخرین-مشاهده-ها", destination: "/recently-viewed" },
 { source: "/محصولات", destination: "/products" },
 { source: "/ورود", destination: "/login" },
 { source: "/%D9%88%D8%B1%D9%88%D8%AF", destination: "/login" },
 { source: "/ثبت-نام", destination: "/register" },
 { source: "/%D8%AB%D8%A8%D8%AA-%D9%86%D8%A7%D9%85", destination: "/register" },
 ];
 },

 images: {
 formats: ["image/avif", "image/webp"],
 deviceSizes: [640, 750, 828, 1080, 1200],
 imageSizes: [16, 32, 48, 64, 96, 128, 256],
 qualities: [65, 75, 80],
 minimumCacheTTL: 60 * 60 * 24 * 365,
 remotePatterns: [
 {
 protocol: "https",
 hostname: "placehold.co"
},
 {
 protocol: "https",
 hostname: "*.supabase.co"
},
 {
 protocol: "https",
 hostname: "media.shadjewel.ir"
},
 {
 protocol: "https",
 hostname: "**.r2.dev"
},
 ]
}
};

export default withBundleAnalyzer(nextConfig);
