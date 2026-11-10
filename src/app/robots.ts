import type { MetadataRoute } from "next";
import { isSiteIndexable, SITE_URL } from "@/lib/seo/indexing";
import { STOREFRONT_PATHS } from "@/lib/seo/storefront-paths";

/**
 * تا وقتی NEXT_PUBLIC_ALLOW_INDEX=true نباشد کل سایت disallow است.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: SITE_URL,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          STOREFRONT_PATHS.dashboard,
          `${STOREFRONT_PATHS.dashboard}/`,
          STOREFRONT_PATHS.checkout,
          `${STOREFRONT_PATHS.checkout}/`,
          "/api/",
          STOREFRONT_PATHS.login,
          STOREFRONT_PATHS.register,
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
