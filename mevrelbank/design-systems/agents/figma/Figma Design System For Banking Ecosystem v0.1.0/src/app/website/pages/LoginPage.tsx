import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { AuthShell, AuthCard, AuthField, AuthInput, AuthError } from "../components/AuthShell";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }

    navigate("/mfa");
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <>
      <PageMeta
        title="Sign In — MevrelBank"
        description="Sign in to your MevrelBank personal or business account."
      />
      <AuthShell>
        <AuthCard>
          <div className="mb-8">
            <h1
              className="text-[26px] font-bold text-[#0D1829] tracking-tight"
              style={{ fontFamily: "Figtree, sans-serif" }}
            >
              Sign in
            </h1>
            <p className="text-[14px] text-[#5E6E8E] mt-1.5">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          {error && <AuthError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-5 mt-5" noValidate>
            <AuthField label="Email address" required>
              <AuthInput
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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

            <div className="flex justify-end">
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

          <div className="mt-6 pt-5 border-t border-[rgba(11,50,112,0.07)] text-center">
            <p className="text-[13px] text-[#5E6E8E]">
              Don't have an account?{" "}
              <a
                href="/register"
                className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
              >
                Create one
              </a>
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    </>
  );
}
