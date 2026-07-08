import type { ReactNode } from "react";

export type BtnVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  variant?: BtnVariant;
  size?: BtnSize;
  children?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  /** Render as an anchor tag when href is provided */
  href?: string;
}

export function Btn({
  variant = "primary",
  size = "md",
  children,
  icon,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  href,
}: BtnProps) {
  const base =
    "inline-flex items-center gap-2 font-semibold rounded-[6px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none whitespace-nowrap";

  const sizes: Record<BtnSize, string> = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2.5 text-[13px]",
    lg: "px-6 py-3 text-[14px]",
  };

  const variants: Record<BtnVariant, string> = {
    primary:
      "bg-[#0B3270] text-white hover:bg-[#0E3E8C] focus:ring-[#0B3270] active:bg-[#091E42]",
    secondary:
      "bg-[#EBF0FA] text-[#0B3270] hover:bg-[#D8E7F8] focus:ring-[#0B3270]",
    outline:
      "border border-[rgba(11,50,112,0.22)] text-[#0B3270] hover:border-[#0B3270] hover:bg-[#EBF0FA] focus:ring-[#0B3270]",
    ghost: "text-[#0B3270] hover:bg-[#EBF0FA] focus:ring-[#0B3270]",
    destructive:
      "bg-[#C52B2B] text-white hover:bg-[#A82424] focus:ring-[#C52B2B]",
  };

  const cls = `${base} ${sizes[size]} ${variants[variant]} ${
    disabled ? "opacity-40 pointer-events-none" : ""
  } ${className}`;

  const inner = (
    <>
      {icon && <span className="flex-shrink-0 flex">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {inner}
    </button>
  );
}
