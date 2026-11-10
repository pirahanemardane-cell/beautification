import { redirect } from "next/navigation";
import {
  locationHref,
  STOREFRONT_PATHS,
} from "@/lib/seo/storefront-paths";

export default function DashboardSettingsRedirect() {
  redirect(locationHref(`${STOREFRONT_PATHS.dashboard}?tab=profile`));
}
