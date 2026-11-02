import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
 className?: string;
 priority?: boolean;
 size?: "sm" | "md" | "lg" | "footer";
};

const sizes = {
 sm: "text-base font-black",
 md: "text-lg font-black",
 lg: "text-xl font-black",
 footer: "text-2xl font-black",
};

export function Logo({ className, size = "md" }: Props) {
 return (
 <Link
 href="/"
 className={cn(
 "inline-flex shrink-0 items-center text-primary tracking-tight",
 sizes[size],
 className
 )}
 aria-label="جواهر شاد"
 >
 جواهر شاد
 </Link>
 );
}
