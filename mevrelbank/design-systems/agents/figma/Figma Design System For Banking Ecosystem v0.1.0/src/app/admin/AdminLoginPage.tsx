import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { AuthShell, AuthCard, AuthField, AuthInput, AuthError } from "../website/components/AuthShell";
import { Btn } from "../website/shared/Btn";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return;

    setLoading(true);
    const result = await login(email, password, remember);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }

    navigate("/admin/mfa");
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <>
      <PageMeta
        title="Admin Sign In — MevrelBank"
        description="Restricted access for MevrelBank support staff."
      />
      <AuthShell>
        <AuthCard>
          <div className="mb-8">
            <div className="w-10 h-10 rounded-[10px] bg-[#EBF0FA] flex items-center justify-center mb-4">
              <ShieldCheck size={18} className="text-[#0B3270]" aria-hidden="true" />
            </div>
            <h1
              className="text-[26px] font-bold text-[#0D1829] tracking-tight"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Admin sign in
            </h1>
            <p className="text-[14px] text-[#5E6E8E] mt-1.5">
              Restricted to MevrelBank support staff only.
            </p>
          </div>

          {error && <AuthError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-5 mt-5" noValidate>
            <AuthField label="Support email address" required>
              <AuthInput
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="support@mevrelbank.com"
                required
              />
            </AuthField>

            <AuthField label="Password" required>
              <div className="relative">
                <AuthInput
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
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
            </AuthField>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-[#5E6E8E] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#B0CFF0] text-[#0B3270] focus:ring-[#0B3270] accent-[#0B3270]"
                />
                Stay signed in
              </label>
              <a
                href="/forgot-password"
                className="text-[13px] font-medium text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Btn
              type="submit"
              size="lg"
              disabled={!canSubmit}
              className="w-full justify-center"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Btn>
          </form>
        </AuthCard>
      </AuthShell>
    </>
  );
}
