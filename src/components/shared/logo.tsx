import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className, size = 36 }: LogoMarkProps) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Lucy AI"
        fill
        className="rounded-full object-cover"
        sizes={`${size}px`}
        priority
      />
    </span>
  );
}

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: number;
}

export function Logo({ className, showText = true, iconSize = 36 }: LogoProps) {
  return (
    <Link
      href={ROUTES.home}
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
      aria-label="Lucy AI home"
    >
      <LogoMark size={iconSize} />
      {showText && (
        <span className="text-lg">
          Lucy <span className="text-gradient">AI</span>
        </span>
      )}
    </Link>
  );
}
