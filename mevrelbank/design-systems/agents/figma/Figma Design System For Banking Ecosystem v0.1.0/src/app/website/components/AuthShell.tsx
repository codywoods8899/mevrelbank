import type { ReactNode } from "react";
import { Logo } from "../shared/Logo";

interface AuthShellProps {
  /** Page-level <title> + <meta description> are handled by PageMeta inside each page */
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col">
      {/* Top bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <a href="/" aria-label="MevrelBank home">
          <Logo heightClass="h-8" />
        </a>
        <a
          href="/"
          className="text-[13px] font-medium text-[#5E6E8E] hover:text-[#0B3270] transition-colors"
        >
          ← Back to website
        </a>
      </header>

      {/* Card area */}
      <main
        id="main-content"
        className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16"
      >
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      {/* Minimal footer */}
      <footer className="px-6 py-5 text-center">
        <p className="text-[11px] text-[#9AAABF]">
          © {new Date().getFullYear()} MevrelBank. All rights reserved.&nbsp;&nbsp;·&nbsp;&nbsp;
          <a href="/security-center" className="hover:text-[#5E6E8E] transition-colors">
            Privacy &amp; Security
          </a>
        </p>
      </footer>
    </div>
  );
}

/** Shared card wrapper used by every auth form */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[rgba(11,50,112,0.09)] bg-white shadow-[0_2px_16px_rgba(11,50,112,0.06)] px-8 py-10">
      {children}
    </div>
  );
}

/** Reusable labelled input row */
interface AuthFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}

export function AuthField({ label, required, optional, error, children }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-[#0D1829] mb-1.5">
        {label}
        {required && (
          <span className="text-[#C52B2B] ml-0.5" aria-hidden="true">
            *
          </span>
        )}
        {optional && (
          <span className="text-[#9AAABF] font-normal ml-1">(optional)</span>
        )}
      </span>
      {children}
      {error && (
        <span className="block text-[12px] text-[#C52B2B] mt-1.5" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

/** Standard text/email/password input */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function AuthInput({ hasError, className = "", ...props }: AuthInputProps) {
  return (
    <input
      {...props}
      className={`w-full rounded-[10px] border px-4 py-3 text-[14px] text-[#0D1829] outline-none transition-colors placeholder:text-[#B0BDCF] ${
        hasError
          ? "border-[#C52B2B] focus:border-[#C52B2B]"
          : "border-[rgba(11,50,112,0.14)] focus:border-[#0B3270]"
      } ${className}`}
    />
  );
}

/** Inline error banner shown above or below the form */
export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B]"
    >
      {message}
    </div>
  );
}
