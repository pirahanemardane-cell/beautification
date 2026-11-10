import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { isSiteIndexable, SITE_URL } from "@/lib/seo/indexing";
import {
  blogPath,
  brandPath,
  categoryPath,
  productPath,
  STOREFRONT_PATHS,
} from "@/lib/seo/storefront-paths";

/**
 * زیرساخت sitemap آماده است.
 * تا noindex: خروجی خالی (ایندکس نمی‌شود).
 * بعد از ALLOW_INDEX=true: صفحات استاتیک + محصولات + دسته‌ها + برندها + بلاگ.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 if (!isSiteIndexable()) {
 return [];
 }

 const now = new Date();
 const staticPaths = [
 "",
 STOREFRONT_PATHS.products,
 STOREFRONT_PATHS.categories,
 STOREFRONT_PATHS.brands,
 STOREFRONT_PATHS.blog,
 STOREFRONT_PATHS.about,
 STOREFRONT_PATHS.contact,
 STOREFRONT_PATHS.faq,
 STOREFRONT_PATHS.shipping,
 STOREFRONT_PATHS.returns,
 STOREFRONT_PATHS.privacy,
 STOREFRONT_PATHS.terms,
 STOREFRONT_PATHS.sizeGuide,
 STOREFRONT_PATHS.search,
 STOREFRONT_PATHS.track,
 STOREFRONT_PATHS.warranty,
 ];

 const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
 url: `${SITE_URL}${path}`,
 lastModified: now,
 changeFrequency: path === "" ? "daily" : "weekly",
 priority: path === "" ? 1 : path === STOREFRONT_PATHS.products ? 0.9 : 0.6,
 }));

 try {
 const supabase = createServiceClient();

 const { data: products } = await supabase
 .from("products")
 .select("slug, updated_at")
 .eq("status", "published")
 .not("slug", "is", null)
 .limit(5000);

 for (const p of products ?? []) {
 const slug = (p as { slug?: string }).slug;
 if (!slug) continue;
 entries.push({
 url: `${SITE_URL}${productPath(slug)}`,
 lastModified: (p as { updated_at?: string }).updated_at
 ? new Date(String((p as { updated_at: string }).updated_at))
 : now,
 changeFrequency: "weekly",
 priority: 0.8,
 });
 }

 const { data: categories } = await supabase
 .from("categories")
 .select("slug, updated_at")
 .eq("is_active", true)
 .limit(500);

 for (const c of categories ?? []) {
 const slug = (c as { slug?: string }).slug;
 if (!slug) continue;
 entries.push({
 url: `${SITE_URL}${categoryPath(slug)}`,
 lastModified: now,
 changeFrequency: "weekly",
 priority: 0.7,
 });
 }

 const { data: brands } = await supabase
 .from("brands")
 .select("slug, updated_at")
 .eq("is_active", true)
 .limit(500);

 for (const b of brands ?? []) {
 const slug = (b as { slug?: string }).slug;
 if (!slug) continue;
 entries.push({
 url: `${SITE_URL}${brandPath(slug)}`,
 lastModified: now,
 changeFrequency: "weekly",
 priority: 0.7,
 });
 }

 try {
 const { data: posts } = await supabase
 .from("blog_posts")
 .select("slug, updated_at, published_at")
 .eq("status", "published")
 .limit(1000);
 for (const post of posts ?? []) {
 const slug = (post as { slug?: string }).slug;
 if (!slug) continue;
 entries.push({
 url: `${SITE_URL}${blogPath(slug)}`,
 lastModified: (post as { updated_at?: string }).updated_at
 ? new Date(String((post as { updated_at: string }).updated_at))
 : now,
 changeFrequency: "monthly",
 priority: 0.5,
 });
 }
 } catch {
 // جدول بلاگ ممکن است نباشد
 }
 } catch (e) {
 console.error("[sitemap]", e);
 }

 return entries;
}
