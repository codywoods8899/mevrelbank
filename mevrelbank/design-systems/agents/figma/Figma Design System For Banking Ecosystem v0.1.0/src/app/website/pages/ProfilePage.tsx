import { ShieldCheck, Mail, Phone } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";

const accountLabel: Record<string, string> = {
  personal: "Personal · Premium",
  business: "Business",
};

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta title="Profile — MevrelBank" description="Manage your MevrelBank profile and security settings." />
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Profile</h1>
        <div className="text-[12px] text-[#8A9BBE]">Account details and security</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
          <div className="text-[13px] font-semibold text-[#0D1829] mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Personal Details</div>
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center gap-2.5">
              <Mail size={13} className="text-[#8A9BBE]" />
              <span className="text-[#0D1829]">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={13} className="text-[#8A9BBE]" />
              <span className="text-[#0D1829]">Not provided</span>
            </div>
            <div className="pt-2 text-[11px] text-[#8A9BBE]">
              {user ? accountLabel[user.accountType] ?? "Personal" : "Personal"} account
            </div>
          </div>
          <Btn variant="outline" size="sm" className="mt-4">Edit details</Btn>
        </div>

        <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
          <div className="text-[13px] font-semibold text-[#0D1829] mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Security</div>
          <div className="flex items-center gap-2.5 mb-3 text-[12px]">
            <ShieldCheck size={13} className="text-[#0E7C4D]" />
            <span className="text-[#0D1829]">Email verified</span>
          </div>
          <div className="flex items-center gap-2.5 mb-4 text-[12px]">
            <ShieldCheck size={13} className="text-[#0E7C4D]" />
            <span className="text-[#0D1829]">Multi-factor authentication enabled (one-time code)</span>
          </div>
          <div className="text-[11px] text-[#8A9BBE]">
            Real TOTP-based MFA provisioning and password changes require the Phase 2 backend, which is not built yet.
          </div>
        </div>
      </div>
    </>
  );
}
