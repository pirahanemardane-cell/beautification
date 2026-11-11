import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  priority?: boolean;
  /** full = icon + wordmark; mark = flower icon only */
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg" | "footer";
};

const FULL_SRC_LIGHT = "/brand/logo-light-transparent.webp";
const FULL_SRC_DARK = "/brand/logo-dark-transparent.webp";
const MARK_SRC = "/brand/mark-flower-transparent.webp";

/** Standard ecommerce nav heights: ~28–36px full mark */
const fullBox = {
  sm: { className: "h-7 w-[auto]", width: 97, height: 28 },
  md: { className: "h-8 w-[auto]", width: 111, height: 32 },
  lg: { className: "h-9 w-[auto]", width: 125, height: 36 },
  footer: { className: "h-8 w-[auto]", width: 111, height: 32 },
} as const;

const markBox = {
  sm: { className: "h-7 w-7", width: 28, height: 28 },
  md: { className: "h-8 w-8", width: 32, height: 32 },
  lg: { className: "h-9 w-9", width: 36, height: 36 },
  footer: { className: "h-8 w-8 sm:h-9 sm:w-9", width: 36, height: 36 },
} as const;

export function Logo({
  className,
  priority = false,
  variant = "full",
  size = "md",
}: Props) {
  const box = variant === "mark" ? markBox[size] : fullBox[size];

  return (
    <Link
      href="/"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        box.className,
        className
      )}
      aria-label="اکسسوری شاد — Shad Jewel"
    >
      {variant === "mark" ? (
        <Image
          src={MARK_SRC}
          alt="Shad Jewel"
          width={box.width}
          height={box.height}
          priority={priority}
          className="h-full w-full object-contain"
        />
      ) : (
        <>
          <Image
            src={FULL_SRC_LIGHT}
            alt="Shad Jewel"
            width={box.width}
            height={box.height}
            priority={priority}
            className="h-full w-auto object-contain dark:hidden"
          />
          <Image
            src={FULL_SRC_DARK}
            alt=""
            aria-hidden
            width={box.width}
            height={box.height}
            priority={priority}
            className="hidden h-full w-auto object-contain dark:block"
          />
        </>
      )}
    </Link>
  );
}
