import { useState } from "react";
import { ShieldCheck, X, Eye, EyeOff, Lock } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

interface Props {
  title: string;
  description: string;
  onClose: () => void;
  /** Called with the short-lived confirmToken once re-auth succeeds. */
  onConfirm: (confirmToken: string) => void;
}

/**
 * Re-authentication gate for destructive / irreversible admin operations.
 * Collects password (+ TOTP code if admin has 2FA enabled), calls
 * POST /admin/re-auth, and hands the resulting confirmToken to the caller.
 * The token is valid for 5 minutes and must be sent as X-Admin-Confirm-Token.
 */
export default function AdminReAuthModal({ title, description, onClose, onConfirm }: Props) {
  const { admin, authedJson } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasTOTP = admin?.totpEnabled ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) { setError("Password is required."); return; }
    if (hasTOTP && !totpCode.trim()) { setError("2FA code is required."); return; }
    setLoading(true);
    try {
      const data = await authedJson("/admin/re-auth", {
        method: "POST",
        body: JSON.stringify({ password, ...(hasTOTP ? { totpCode: totpCode.trim() } : {}) }),
      });
      onConfirm(data.confirmToken);
    } catch (err: any) {
      setError(err.message ?? "Re-authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[rgba(11,50,112,0.08)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center">
              <Lock size={15} className="text-[#C52B2B]" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>
                {title}
              </h3>
              <p className="text-[12px] text-[#5E6E8E] mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9AAABF] hover:text-[#5E6E8E] ml-2 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="rounded-[10px] bg-[#FDF5E6] border border-[rgba(180,106,10,0.2)] px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#B46A0A]">
              <ShieldCheck size={13} />
              Administrator re-authentication required
            </div>
            <p className="text-[11px] text-[#8A5C0A] mt-1">
              This action is irreversible. Confirm your identity to proceed.
            </p>
          </div>

          {error && (
            <div className="rounded-[8px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#C52B2B]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1.5">
              Admin password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password"
                autoFocus
                className="w-full px-3 py-2.5 pr-10 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] focus:ring-1 focus:ring-[rgba(11,50,112,0.1)]"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AAABF] hover:text-[#5E6E8E]"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {hasTOTP && (
            <div>
              <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1.5">
                2FA code (from your authenticator app)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] focus:ring-1 focus:ring-[rgba(11,50,112,0.1)] tracking-[0.2em] font-mono"
              />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#C52B2B] text-white text-[13px] font-semibold hover:bg-[#a82424] disabled:opacity-60 transition-colors"
            >
              {loading ? "Verifying…" : "Confirm identity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
