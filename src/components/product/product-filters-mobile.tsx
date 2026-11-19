"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductFiltersSidebar } from "./product-filters-sidebar";
import type { AttributeWithOptions } from "@/repositories/attribute.repository";
import { cn } from "@/lib/utils";

type Chip = { id: string; name: string; slug: string; hex?: string | null };
type Props = {
  facets: AttributeWithOptions[];
  current: Record<string, string>;
  colors?: Chip[];
  sizes?: Chip[];
  colorSlug?: string;
  sizeSlug?: string;
  inStock?: boolean;
  categories?: { name: string; slug: string }[];
  categorySlug?: string;
  brandSlug?: string;
  brands?: { name: string; slug: string }[];
  q?: string;
  sort?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
};

export function ProductFiltersMobile(props: Props) {
  const [open, setOpen] = useState(false);
  const count = useMemo(() => {
    let n = Object.keys(props.current).length;
    if (props.categorySlug) n++;
    if (props.brandSlug) n++;
    if (props.colorSlug) n++;
    if (props.sizeSlug) n++;
    if (props.inStock) n++;
    if (props.minPrice) n++;
    if (props.maxPrice) n++;
    if (props.featured) n++;
    if (props.sort && props.sort !== "newest") n++;
    return n;
  }, [props]);

  return (
    <div className="mb-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(
            "border-input bg-background hover:bg-muted inline-flex h-8 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          فیلترها
          {count > 0 ? (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] leading-4">
              {count}
            </span>
          ) : null}
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[min(100%,20rem)] overflow-y-auto p-0"
        >
          <SheetHeader className="border-b px-4 py-3 text-start">
            <SheetTitle className="text-base text-primary">فیلترها</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <ProductFiltersSidebar {...props} forceVisible />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
