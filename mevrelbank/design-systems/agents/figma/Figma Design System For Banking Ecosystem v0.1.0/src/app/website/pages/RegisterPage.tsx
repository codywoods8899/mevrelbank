import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { AuthShell, AuthCard, AuthField, AuthInput, AuthError } from "../components/AuthShell";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

type AccountType = "personal" | "business" | "";

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const hasLength = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const score = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const label = score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const colour =
    score <= 2
      ? "bg-[#C52B2B]"
      : score === 3
      ? "bg-[#D97706]"
      : score === 4
      ? "bg-[#2563EB]"
      : "bg-[#16A34A]";
  const textColour =
    score <= 2
      ? "text-[#C52B2B]"
      : score === 3
      ? "text-[#D97706]"
      : score === 4
      ? "text-[#2563EB]"
      : "text-[#16A34A]";

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? colour : "bg-[rgba(11,50,112,0.08)]"
            }`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${textColour}`}>{label}</span>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Please enter your full name.";
    if (!email.trim()) errs.email = "Please enter your email address.";
    if (pwd.length < 8) errs.password = "Password must be at least 8 characters.";
    if (pwd !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (!accountType) errs.accountType = "Please choose an account type.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    if (!agreed) {
      setError("Please accept the terms and conditions to continue.");
      return;
    }
    setLoading(true);
    const result = await register(fullName, email, pwd, accountType as "personal" | "business");
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to create account.");
      return;
    }

    navigate("/verify-email");
  };

  const canSubmit = fullName.trim() && email.trim() && pwd && confirmPassword && accountType && agreed && !loading;

  return (
    <>
      <PageMeta
        title="Create an Account — MevrelBank"
        description="Open a personal or business account with MevrelBank. Fast, secure digital banking."
      />
      <AuthShell>
        <AuthCard>
          <div className="mb-8">
            <h1
              className="text-[26px] font-bold text-[#0D1829] tracking-tight"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Create an account
            </h1>
            <p className="text-[14px] text-[#5E6E8E] mt-1.5">
              Join MevrelBank — personal or business banking, built for modern life.
            </p>
          </div>

          {error && <AuthError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-5 mt-5" noValidate>
            <AuthField label="Full name" required error={fieldErrors.fullName}>
              <AuthInput
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                hasError={!!fieldErrors.fullName}
              />
            </AuthField>

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

            <AuthField label="Password" required error={fieldErrors.password}>
              <div className="relative">
                <AuthInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="Create a password"
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

            <AuthField label="Confirm password" required error={fieldErrors.confirmPassword}>
              <AuthInput
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                hasError={!!fieldErrors.confirmPassword}
              />
            </AuthField>

            <fieldset>
              <legend className="block text-[13px] font-semibold text-[#0D1829] mb-2">
                Account type{" "}
                <span className="text-[#C52B2B]" aria-hidden="true">
                  *
                </span>
              </legend>
              {fieldErrors.accountType && (
                <span className="block text-[12px] text-[#C52B2B] mb-2" role="alert">
                  {fieldErrors.accountType}
                </span>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {(["personal", "business"] as const).map((type) => (
                  <label
                    key={type}
                    className={`flex items-start gap-3 rounded-[12px] border p-4 cursor-pointer transition-colors ${
                      accountType === type
                        ? "border-[#0B3270] bg-[#EBF0FA]"
                        : "border-[rgba(11,50,112,0.14)] hover:border-[rgba(11,50,112,0.30)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={type}
                      checked={accountType === type}
                      onChange={() => setAccountType(type)}
                      className="mt-0.5 accent-[#0B3270]"
                    />
                    <div>
                      <div className="text-[14px] font-semibold text-[#0D1829] capitalize">
                        {type}
                      </div>
                      <div className="text-[12px] text-[#5E6E8E] mt-0.5">
                        {type === "personal"
                          ? "Everyday accounts, savings, and payments."
                          : "Business accounts, team access, and payroll."}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#0B3270]"
              />
              <span className="text-[13px] text-[#5E6E8E] leading-relaxed">
                I agree to the{" "}
                <a
                  href="/security-center"
                  className="text-[#0B3270] hover:text-[#0E3E8C] transition-colors underline underline-offset-2"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/security-center"
                  className="text-[#0B3270] hover:text-[#0E3E8C] transition-colors underline underline-offset-2"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <Btn
              type="submit"
              size="lg"
              disabled={!canSubmit}
              className="w-full justify-center"
            >
              {loading ? "Creating account…" : "Create account"}
            </Btn>
          </form>

          <div className="mt-6 pt-5 border-t border-[rgba(11,50,112,0.07)] text-center">
            <p className="text-[13px] text-[#5E6E8E]">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    </>
  );
}
