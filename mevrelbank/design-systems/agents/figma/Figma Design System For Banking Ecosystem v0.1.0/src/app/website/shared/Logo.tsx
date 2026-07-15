// Brand logo component backed by the canonical PNG assets from brand/logo/web.
//
// Variants
//   "light"  — full horizontal wordmark, dark ink on transparent bg (for white / light surfaces)
//   "dark"   — full horizontal wordmark, white ink on transparent bg  (for dark / navy surfaces)
//   "symbol" — standalone icon mark, colour version on transparent bg (for compact light contexts)
//   "symbol-dark" — standalone icon mark, colour version (same asset, alias for dark contexts
//                   where the coloured icon reads well — e.g. a very dark sidebar without text)
//
// Asset pixel dimensions:
//   horizontal-logo  : 1010 × 343 px  (~2.94 : 1)
//   reverse-logo     : 957  × 319 px  (~3.00 : 1)
//   primary-logo     : 1089 × 360 px  (~3.03 : 1)
//   symbol-favicon   : 565  × 565 px  (1 : 1, square — used for symbol variant)
//   symbol-logo      : 386  × 472 px  (portrait — reserved / not used in UI)
//
// All PNGs are RGBA with transparent backgrounds.

interface LogoProps {
  /** "light"       = full horizontal wordmark for light / white backgrounds (default)
   *  "dark"        = full horizontal wordmark (white ink) for dark / navy backgrounds
   *  "symbol"      = square icon mark for compact contexts (coloured, any bg)
   *  "symbol-dark" = alias for "symbol" — same asset, kept for semantic clarity */
  variant?: "light" | "dark" | "symbol" | "symbol-dark";
  className?: string;
  /** Override rendered height via Tailwind class, e.g. "h-7", "h-8", "h-10" */
  heightClass?: string;
}

export function Logo({ variant = "light", className = "", heightClass = "h-8" }: LogoProps) {
  const src =
    variant === "dark"
      ? "/brand/mevrelbank-reverse-logo-v1.png"
      : variant === "symbol" || variant === "symbol-dark"
        ? "/brand/mevrelbank-symbol-favicon-v1.png"
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
