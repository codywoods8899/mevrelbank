import { useState } from "react";
import { useSearchParams } from "react-router";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { AuthShell, AuthCard, AuthField, AuthInput, AuthError } from "../components/AuthShell";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const hasLength  = value.length >= 8;
  const hasUpper   = /[A-Z]/.test(value);
  const hasLower   = /[a-z]/.test(value);
  const hasNumber  = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const score = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const label = score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const bar = score <= 2 ? "bg-[#C52B2B]" : score === 3 ? "bg-[#D97706]" : score === 4 ? "bg-[#2563EB]" : "bg-[#16A34A]";
  const text = score <= 2 ? "text-[#C52B2B]" : score === 3 ? "text-[#D97706]" : score === 4 ? "text-[#2563EB]" : "text-[#16A34A]";
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? bar : "bg-[rgba(11,50,112,0.08)]"}`} />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${text}`}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";

  const [email, setEmail]                   = useState(prefillEmail);
  const [code, setCode]                     = useState("");
  const [pwd, setPwd]                       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [error, setError]                   = useState("");
  const [fieldErrors, setFieldErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]               = useState(false);
  const [done, setDone]                     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    if (!email.trim())             errs.email   = "Please enter your email address.";
    if (!/^\d{6}$/.test(code.trim())) errs.code = "Enter the 6-digit code from your email.";
    if (pwd.length < 8)            errs.password = "Password must be at least 8 characters.";
    if (pwd !== confirmPassword)   errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    const result = await resetPassword(email.trim(), code.trim(), pwd);
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Unable to reset password."); return; }
    setDone(true);
  };

  const canSubmit = email.trim() && code.trim().length === 6 && pwd.length >= 8 && confirmPassword && !loading;

  return (
    <>
      <PageMeta
        title="Set a New Password — MevrelBank"
        description="Enter your reset code and choose a new password for your MevrelBank account."
      />
      <AuthShell>
        <AuthCard>
          {done ? (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <CheckCircle2 size={44} className="text-[#16A34A]" aria-hidden="true" />
              <div>
                <h1
                  className="text-[24px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Password updated
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-2">
                  Your password has been changed. Sign in with your new password.
                </p>
              </div>
              <Btn variant="primary" size="lg" href="/login" className="w-full justify-center">
                Sign in
              </Btn>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1
                  className="text-[26px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Set a new password
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-1.5">
                  Enter the 6-digit code from your email and choose a new password.
                </p>
              </div>

              {error && <AuthError message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5 mt-5" noValidate>
                {!prefillEmail && (
                  <AuthField label="Email address" required error={fieldErrors.email}>
                    <AuthInput
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      hasError={!!fieldErrors.email}
                    />
                  </AuthField>
                )}

                <AuthField label="Reset code" required error={fieldErrors.code}>
                  <AuthInput
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    hasError={!!fieldErrors.code}
                  />
                </AuthField>

                <AuthField label="New password" required error={fieldErrors.password}>
                  <div className="relative">
                    <AuthInput
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="Create a new password"
                      hasError={!!fieldErrors.password}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AAABF] hover:text-[#5E6E8E] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength value={pwd} />
                </AuthField>

                <AuthField label="Confirm new password" required error={fieldErrors.confirmPassword}>
                  <AuthInput
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    hasError={!!fieldErrors.confirmPassword}
                  />
                </AuthField>

                <Btn
                  type="submit"
                  size="lg"
                  disabled={!canSubmit}
                  className="w-full justify-center"
                >
                  {loading ? "Updating…" : "Set new password"}
                </Btn>
              </form>

              <div className="mt-6 pt-5 border-t border-[rgba(11,50,112,0.07)] text-center">
                <p className="text-[13px] text-[#5E6E8E]">
                  Need a new code?{" "}
                  <a
                    href="/forgot-password"
                    className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
                  >
                    Resend
                  </a>
                </p>
              </div>
            </>
          )}
        </AuthCard>
      </AuthShell>
    </>
  );
}
