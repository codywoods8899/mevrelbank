import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Smartphone, Shield } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { AuthShell, AuthCard, AuthError } from "../website/components/AuthShell";
import { Btn } from "../website/shared/Btn";
import { useAdminAuth } from "../context/AdminAuthContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => {
    setSeconds(initial);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(timer.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  return { seconds, start };
}

export default function AdminMFAPage() {
  const { verifyMFA, sendMfaEmailCode } = useAdminAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"totp" | "email">("totp");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { seconds: cooldown, start: startCooldown } = useCountdown(RESEND_COOLDOWN);

  useEffect(() => { inputRefs.current[0]?.focus(); }, [mode]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const switchToEmail = async () => {
    setMode("email");
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    startCooldown();
    const result = await sendMfaEmailCode();
    if (result.success) setEmailSent(true);
    else setError(result.error ?? "Failed to send code.");
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    startCooldown();
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    const result = await sendMfaEmailCode();
    if (!result.success) setError(result.error ?? "Failed to send code.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    const result = await verifyMFA(code);
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Unable to verify code."); return; }
    navigate("/admin");
  };

  return (
    <>
      <PageMeta title="Admin Verification — MevrelBank" description="Verify your identity to access the admin panel." />
      <AuthShell>
        <AuthCard>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#EBF0FA] flex items-center justify-center flex-shrink-0">
                {mode === "totp" ? (
                  <Shield size={18} className="text-[#0B3270]" aria-hidden="true" />
                ) : (
                  <Smartphone size={18} className="text-[#0B3270]" aria-hidden="true" />
                )}
              </div>
              <div>
                <h1 className="text-[22px] font-bold text-[#0D1829] tracking-tight leading-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
                  Two-factor verification
                </h1>
                <p className="text-[13px] text-[#5E6E8E] mt-0.5">
                  {mode === "totp"
                    ? "Enter the 6-digit code from your authenticator app."
                    : emailSent
                    ? "A code has been sent to the support inbox."
                    : "Sending a code to the support inbox…"}
                </p>
              </div>
            </div>
          </div>

          {error && <AuthError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-7 mt-5" noValidate>
            <div className="flex gap-2.5 justify-center" role="group" aria-label="One-time password" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-14 rounded-[10px] border border-[rgba(11,50,112,0.14)] text-center text-[20px] font-semibold text-[#0D1829] outline-none focus:border-[#0B3270] transition-colors caret-transparent"
                />
              ))}
            </div>
            <Btn type="submit" size="lg" disabled={otp.join("").length < OTP_LENGTH || loading} className="w-full justify-center">
              {loading ? "Verifying…" : "Verify"}
            </Btn>
          </form>

          <div className="mt-6 pt-5 border-t border-[rgba(11,50,112,0.07)] space-y-3 text-center">
            {mode === "totp" ? (
              <p className="text-[13px] text-[#5E6E8E]">
                Can't access your app?{" "}
                <button type="button" onClick={switchToEmail} className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors">
                  Send code to email
                </button>
              </p>
            ) : (
              <p className="text-[13px] text-[#5E6E8E]">
                Didn't receive it?{" "}
                {cooldown > 0 ? (
                  <span className="text-[#9AAABF]">Resend in {cooldown}s</span>
                ) : (
                  <button type="button" onClick={handleResendEmail} className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors">
                    Resend to email
                  </button>
                )}
              </p>
            )}
            <p className="text-[13px] text-[#5E6E8E]">
              <a href="/admin/login" className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors">
                Back to admin sign in
              </a>
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    </>
  );
}
