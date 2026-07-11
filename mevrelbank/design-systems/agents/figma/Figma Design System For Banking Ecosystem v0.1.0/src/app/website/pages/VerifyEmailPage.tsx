import { useState, useRef, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { AuthShell, AuthCard, AuthError } from "../components/AuthShell";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setSeconds(initial);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return { seconds, start };
}

export default function VerifyEmailPage() {
  const { verifyOTP } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { seconds: resendCooldown, start: startResendTimer } = useCountdown(RESEND_COOLDOWN);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    startResendTimer();
  }, []);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await verifyOTP(code);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to verify code.");
      return;
    }

    setVerified(true);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    startResendTimer();
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    // TODO: trigger resend API
  };

  return (
    <>
      <PageMeta
        title="Verify Your Email — MevrelBank"
        description="Enter the 6-digit code sent to your email to verify your MevrelBank account."
      />
      <AuthShell>
        <AuthCard>
          {verified ? (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <CheckCircle2 size={44} className="text-[#16A34A]" aria-hidden="true" />
              <div>
                <h1
                  className="text-[24px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Email verified
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-2">
                  Your email has been confirmed. You can now sign in to your account.
                </p>
              </div>
              <Btn variant="primary" size="lg" href="/login" className="w-full justify-center">
                Continue to sign in
              </Btn>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1
                  className="text-[26px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Verify your email
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-1.5">
                  We sent a 6-digit code to your email address. Enter it below to confirm your
                  account.
                </p>
              </div>

              {error && <AuthError message={error} />}

              <form onSubmit={handleSubmit} className="space-y-7 mt-5" noValidate>
                <div>
                  <div
                    className="flex gap-2.5 justify-center"
                    role="group"
                    aria-label="One-time password"
                    onPaste={handlePaste}
                  >
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
                </div>

                <Btn
                  type="submit"
                  size="lg"
                  disabled={otp.join("").length < OTP_LENGTH || loading}
                  className="w-full justify-center"
                >
                  {loading ? "Verifying…" : "Verify email"}
                </Btn>
              </form>

              <div className="mt-6 pt-5 border-t border-[rgba(11,50,112,0.07)] text-center space-y-2">
                <p className="text-[13px] text-[#5E6E8E]">
                  Didn't receive a code?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-[#9AAABF]">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
                    >
                      Resend code
                    </button>
                  )}
                </p>
                <p className="text-[13px] text-[#5E6E8E]">
                  Wrong email?{" "}
                  <a
                    href="/register"
                    className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
                  >
                    Go back
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
