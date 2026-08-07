import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminSettingsPage() {
  const { authedJson } = useAdminAuth();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authedJson("/admin/settings")
      .then((data) => setWhatsappNumber(data.settings?.whatsapp_number ?? ""))
      .catch((err) => setError(err.message ?? "Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const data = await authedJson("/admin/settings/whatsapp", {
        method: "PATCH",
        body: JSON.stringify({ whatsappNumber }),
      });
      setWhatsappNumber(data.whatsappNumber);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageMeta title="Settings — MevrelBank Admin" description="Site-wide settings for MevrelBank." />
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
          Settings
        </h1>
        <p className="text-[13px] text-[#5E6E8E] mt-1">Site-wide configuration for the public website and customer dashboard.</p>
      </div>

      <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white p-6 max-w-[520px]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[9px] bg-[#E9F9EF] flex items-center justify-center">
            <MessageCircle size={16} className="text-[#25D366]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#0D1829]">WhatsApp contact number</p>
            <p className="text-[12px] text-[#9AAABF]">Powers the floating WhatsApp button shown on every page.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-[13px] text-[#9AAABF]">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="whatsapp-number" className="block text-[12px] font-semibold text-[#5E6E8E] mb-1.5">
              Phone number (with country code)
            </label>
            <input
              id="whatsapp-number"
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+15551234567"
              className="w-full h-10 px-3 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[14px] text-[#0D1829] placeholder-[#9AAABF] focus:outline-none focus:ring-2 focus:ring-[#0B3270]/20 focus:border-[#0B3270] transition-all"
            />
            <p className="text-[11px] text-[#9AAABF] mt-1.5">
              Digits only, with a leading + and country code — e.g. +15551234567. Leave blank to hide the button.
            </p>

            {error && (
              <div className="mt-4 px-3 py-2.5 rounded-[8px] bg-[#FBE9E7] text-[#9A2C1D] text-[12px] font-medium">{error}</div>
            )}
            {saved && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#E9F9EF] text-[#0E7C4D] text-[12px] font-medium">
                <CheckCircle2 size={14} />
                Saved.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 h-10 px-5 rounded-[8px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0E3E8C] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
