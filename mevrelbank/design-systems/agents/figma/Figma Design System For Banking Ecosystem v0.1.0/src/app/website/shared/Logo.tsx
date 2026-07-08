// Brand logo component backed by the canonical PNG assets from brand/logo/web.

interface LogoProps {
  /** "light" = horizontal logo for light/white backgrounds (default)
   *  "dark"  = reverse logo for dark/navy backgrounds */
  variant?: "light" | "dark";
  className?: string;
  /** Override rendered height (Tailwind class, e.g. "h-7", "h-8", "h-10") */
  heightClass?: string;
}

export function Logo({ variant = "light", className = "", heightClass = "h-8" }: LogoProps) {
  const src =
    variant === "dark"
      ? "/brand/mevrelbank-reverse-logo-v1.png"
      : "/brand/mevrelbank-horizontal-logo-v1.png";

  return (
    <img
      src={src}
      alt="MevrelBank"
      className={`${heightClass} w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
