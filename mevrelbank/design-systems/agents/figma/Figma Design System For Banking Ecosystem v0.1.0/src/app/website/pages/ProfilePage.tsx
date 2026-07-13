import { useState, useEffect } from "react";
import { ShieldCheck, ShieldOff, Mail, Phone, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

const accountLabel: Record<string, string> = {
  personal: "Personal · Premium",
  business: "Business",
};

// ─── TOTP Setup Modal ─────────────────────────────────────────────────────────

function TotpSetupModal({ onClose }: { onClose: () => void }) {
  const { setupTotp, enableTotp } = useAuth();
  const [step, setStep] = useState<"loading" | "scan" | "confirm" | "done" | "error">("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setupTotp().then((data) => {
      if (!data) { setStep("error"); return; }
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("scan");
    });
  }, []);

  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code from your app."); return; }
    setError("");
    setSaving(true);
    const result = await enableTotp(secret, code.trim());
    setSaving(false);
    if (!result.success) { setError(result.error ?? "Incorrect code. Try again."); return; }
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[20px] w-full max-w-md p-8 shadow-2xl border border-[rgba(11,50,112,0.08)]">
        {step === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={32} className="text-[#0B3270] animate-spin" />
            <p className="text-[14px] text-[#5E6E8E]">Setting up authenticator…</p>
          </div>
        )}

        {step === "scan" && (
          <>
            <h2 className="text-[20px] font-bold text-[#0D1829] mb-2" style={{ fontFamily: "Figtree, sans-serif" }}>
              Set up authenticator app
            </h2>
            <p className="text-[13px] text-[#5E6E8E] mb-6">
              Scan this QR code with Google Authenticator, Authy, or any TOTP app.
            </p>
            <div className="flex justify-center mb-5">
              <img src={qrCode} alt="TOTP QR code" width={200} height={200} className="rounded-[10px] border border-[rgba(11,50,112,0.1)]" />
            </div>
            <p className="text-[11px] text-[#9AAABF] text-center mb-6">
              Can't scan? Enter this code manually:<br />
              <span className="font-mono font-semibold text-[#0B3270] tracking-widest">{secret}</span>
            </p>
            <Btn size="lg" className="w-full justify-center" onClick={() => setStep("confirm")}>
              I've scanned it — next
            </Btn>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 className="text-[20px] font-bold text-[#0D1829] mb-2" style={{ fontFamily: "Figtree, sans-serif" }}>
              Confirm your code
            </h2>
            <p className="text-[13px] text-[#5E6E8E] mb-5">
              Enter the 6-digit code shown in your authenticator app to activate.
            </p>
            {error && (
              <div className="flex items-center gap-2 mb-4 text-[13px] text-[#C52B2B] bg-[#FEF2F2] rounded-[8px] px-3 py-2.5">
                <AlertCircle size={14} />{error}
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full h-12 rounded-[10px] border border-[rgba(11,50,112,0.14)] text-center text-[22px] font-semibold text-[#0D1829] outline-none focus:border-[#0B3270] transition-colors tracking-[6px] mb-5"
            />
            <div className="flex gap-3">
              <Btn variant="outline" size="md" className="flex-1 justify-center" onClick={() => setStep("scan")}>Back</Btn>
              <Btn size="md" className="flex-1 justify-center" disabled={code.length < 6 || saving} onClick={handleConfirm}>
                {saving ? "Activating…" : "Activate"}
              </Btn>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CheckCircle2 size={44} className="text-[#16A34A]" />
            <div>
              <h2 className="text-[20px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>
                Authenticator enabled
              </h2>
              <p className="text-[13px] text-[#5E6E8E] mt-2">
                Your account is now protected with two-factor authentication.
              </p>
            </div>
            <Btn size="lg" className="w-full justify-center" onClick={onClose}>Done</Btn>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <AlertCircle size={44} className="text-[#C52B2B]" />
            <p className="text-[13px] text-[#5E6E8E]">Failed to set up authenticator. Please try again.</p>
            <Btn variant="outline" size="md" onClick={onClose}>Close</Btn>
          </div>
        )}

        {step !== "done" && step !== "error" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#9AAABF] hover:text-[#5E6E8E] text-[20px] leading-none"
            aria-label="Close"
          >×</button>
        )}
      </div>
    </div>
  );
}

// ─── Disable TOTP Modal ───────────────────────────────────────────────────────

function TotpDisableModal({ onClose }: { onClose: () => void }) {
  const { disableTotp } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDisable = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code from your app."); return; }
    setError("");
    setLoading(true);
    const result = await disableTotp(code.trim());
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Incorrect code."); return; }
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[20px] w-full max-w-md p-8 shadow-2xl border border-[rgba(11,50,112,0.08)] relative">
        {done ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CheckCircle2 size={44} className="text-[#16A34A]" />
            <div>
              <h2 className="text-[20px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>
                Authenticator disabled
              </h2>
              <p className="text-[13px] text-[#5E6E8E] mt-2">
                Two-factor authentication has been turned off.
              </p>
            </div>
            <Btn size="lg" className="w-full justify-center" onClick={onClose}>Done</Btn>
          </div>
        ) : (
          <>
            <h2 className="text-[20px] font-bold text-[#0D1829] mb-2" style={{ fontFamily: "Figtree, sans-serif" }}>
              Disable authenticator?
            </h2>
            <p className="text-[13px] text-[#5E6E8E] mb-5">
              Enter your current 6-digit authenticator code to confirm. This will remove two-factor protection from your account.
            </p>
            {error && (
              <div className="flex items-center gap-2 mb-4 text-[13px] text-[#C52B2B] bg-[#FEF2F2] rounded-[8px] px-3 py-2.5">
                <AlertCircle size={14} />{error}
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full h-12 rounded-[10px] border border-[rgba(11,50,112,0.14)] text-center text-[22px] font-semibold text-[#0D1829] outline-none focus:border-[#0B3270] transition-colors tracking-[6px] mb-5"
            />
            <div className="flex gap-3">
              <Btn variant="outline" size="md" className="flex-1 justify-center" onClick={onClose}>Cancel</Btn>
              <Btn
                size="md"
                className="flex-1 justify-center !bg-[#C52B2B] hover:!bg-[#A82222]"
                disabled={code.length < 6 || loading}
                onClick={handleDisable}
              >
                {loading ? "Disabling…" : "Disable"}
              </Btn>
            </div>
          </>
        )}
        {!done && (
          <button onClick={onClose} className="absolute top-4 right-4 text-[#9AAABF] hover:text-[#5E6E8E] text-[20px] leading-none" aria-label="Close">×</button>
        )}
      </div>
    </div>
  );
}

// ─── Edit Details Modal ─────────────────────────────────────────────────────

function EditDetailsModal({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setError("");
    setSaving(true);
    const result = await updateProfile({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    setSaving(false);
    if (!result.success) { setError(result.error ?? "Could not save changes."); return; }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[20px] w-full max-w-md p-8 shadow-2xl border border-[rgba(11,50,112,0.08)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9AAABF] hover:text-[#5E6E8E] text-[20px] leading-none" aria-label="Close">×</button>
        <h2 className="text-[20px] font-bold text-[#0D1829] mb-5" style={{ fontFamily: "Figtree, sans-serif" }}>Edit personal details</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full mb-3 px-3 py-2.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Phone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000"
            className="w-full mb-3 px-3 py-2.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270]" />
          <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="123 High Street, London, SW1A 1AA"
            className="w-full mb-4 px-3 py-2.5 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] resize-none" />
          {error && (
            <div className="flex items-center gap-2 mb-4 text-[13px] text-[#C52B2B] bg-[#FEF2F2] rounded-[8px] px-3 py-2.5">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <div className="flex gap-3">
            <Btn variant="outline" size="md" className="flex-1 justify-center" onClick={onClose}>Cancel</Btn>
            <Btn size="md" className="flex-1 justify-center" disabled={saving} type="submit">{saving ? "Saving…" : "Save changes"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <PageMeta title="Profile — MevrelBank" description="Manage your MevrelBank profile and security settings." />

      {showSetup && <TotpSetupModal onClose={() => setShowSetup(false)} />}
      {showDisable && <TotpDisableModal onClose={() => setShowDisable(false)} />}
      {showEdit && <EditDetailsModal onClose={() => setShowEdit(false)} />}

      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Profile</h1>
        <div className="text-[12px] text-[#8A9BBE]">Account details and security</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
          <div className="text-[13px] font-semibold text-[#0D1829] mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Personal Details</div>
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold text-[#8A9BBE] w-16">Name</span>
              <span className="text-[#0D1829]">{user?.name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold text-[#8A9BBE] w-16">Email</span>
              <span className="text-[#0D1829]">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={12} className="text-[#8A9BBE]" />
              {user?.phone ? (
                <span className="text-[#0D1829]">{user.phone}</span>
              ) : (
                <span className="text-[#9AAABF] italic">Not provided</span>
              )}
            </div>
            {user?.address && (
              <div className="flex items-start gap-2.5">
                <span className="text-[11px] font-semibold text-[#8A9BBE] w-16 flex-shrink-0">Address</span>
                <span className="text-[#0D1829] whitespace-pre-line">{user.address}</span>
              </div>
            )}
            <div className="pt-2 text-[11px] text-[#8A9BBE]">
              {user ? accountLabel[user.accountType] ?? "Personal" : "Personal"} account
            </div>
          </div>
          <Btn variant="outline" size="sm" className="mt-4" onClick={() => setShowEdit(true)}>Edit details</Btn>
        </div>

        <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
          <div className="text-[13px] font-semibold text-[#0D1829] mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Security</div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-2.5 text-[12px]">
              <ShieldCheck size={13} className="text-[#0E7C4D] flex-shrink-0" />
              <span className="text-[#0D1829]">Email verified</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[12px]">
                {user?.totpEnabled ? (
                  <>
                    <ShieldCheck size={13} className="text-[#0E7C4D] flex-shrink-0" />
                    <span className="text-[#0D1829]">Authenticator app enabled</span>
                  </>
                ) : (
                  <>
                    <ShieldOff size={13} className="text-[#9AAABF] flex-shrink-0" />
                    <span className="text-[#9AAABF]">Authenticator app not set up</span>
                  </>
                )}
              </div>
              {user?.totpEnabled ? (
                <button
                  onClick={() => setShowDisable(true)}
                  className="text-[11px] font-semibold text-[#C52B2B] hover:text-[#A82222] transition-colors"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={() => setShowSetup(true)}
                  className="text-[11px] font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
                >
                  Set up
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-[12px]">
              <KeyRound size={13} className="text-[#8A9BBE] flex-shrink-0" />
              <a href="/forgot-password" className="text-[#0B3270] hover:text-[#0E3E8C] transition-colors font-medium">
                Change password
              </a>
            </div>
          </div>

          {!user?.totpEnabled && (
            <div className="bg-[#EBF0FA] rounded-[8px] p-3 text-[11px] text-[#5E6E8E] leading-relaxed">
              <span className="font-semibold text-[#0B3270]">Recommended:</span> Add an authenticator app for stronger account security.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
