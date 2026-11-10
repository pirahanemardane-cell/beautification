import { redirect } from "next/navigation";
import {
  locationHref,
  STOREFRONT_PATHS,
} from "@/lib/seo/storefront-paths";

/** /dashboard/orders → تب سفارش‌ها */
export default function DashboardOrdersRedirect() {
  redirect(locationHref(`${STOREFRONT_PATHS.dashboard}?tab=orders`));
}
