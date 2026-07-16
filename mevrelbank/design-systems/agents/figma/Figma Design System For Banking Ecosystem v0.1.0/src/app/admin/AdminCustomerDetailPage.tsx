import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft, ShieldAlert, ShieldCheck, Pencil, X, Check,
  Archive, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminReAuthModal from "./AdminReAuthModal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  accountType: string;
  emailVerified: boolean;
  totpEnabled: boolean;
  isActive: boolean;
  archivedAt: string | null;
  archiveReason: string | null;
  archivedById: string | null;
  archivedByName: string | null;
  createdAt: string;
}

interface AccountRow {
  id: string;
  name: string;
  type: string;
  routingNumber: string;
  accountNumber: string;
  balance: number;
  available: number;
  status: string;
  closeReason: string | null;
  closedAt: string | null;
  closedByName: string | null;
}

interface TxRow {
  id: string;
  account: string;
  name: string;
  category: string;
  txType: string;
  amount: number;
  status: string;
  adminReason: string | null;
  adminName: string | null;
  date: string;
}

interface Detail {
  user: UserProfile;
  accounts: AccountRow[];
  transactions: TxRow[];
}

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[rgba(11,50,112,0.08)] bg-white p-4">
      <p className="text-[12px] text-[#9AAABF]">{label}</p>
      <p className="text-[14px] font-semibold text-[#0D1829] mt-1">{value}</p>
    </div>
  );
}

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    transaction:   { bg: "#EBF0FA", text: "#5E6E8E", label: "Transaction" },
    adjustment:    { bg: "#FDF0D6", text: "#B46A0A", label: "Adjustment" },
    reversal:      { bg: "#EBF0FA", text: "#0B3270", label: "Reversal" },
    void_reversal: { bg: "#F4E6FA", text: "#7C2DB0", label: "Void" },
  };
  const s = map[type] ?? map.transaction;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { authedJson } = useAdminAuth();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [updating, setUpdating] = useState(false);

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "", accountType: "personal" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editReAuthOpen, setEditReAuthOpen] = useState(false);

  // Archive state
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveConfirmToken, setArchiveConfirmToken] = useState<string | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const load = () => {
    if (!id) return;
    authedJson(`/admin/users/${id}`)
      .then((d) => {
        setData(d);
        setEditForm({
          name: d.user.name ?? "",
          email: d.user.email ?? "",
          phone: d.user.phone ?? "",
          address: d.user.address ?? "",
          accountType: d.user.accountType ?? "personal",
        });
      })
      .catch((err: any) => setError(err.message ?? "Failed to load customer."));
  };

  useEffect(load, [id]);

  const toggleActive = async () => {
    if (!data) return;
    setUpdating(true);
    try {
      await authedJson(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !data.user.isActive }),
      });
      showToast(data.user.isActive ? "Account suspended." : "Account reactivated.", "success");
      load();
    } catch (err: any) {
      showToast(err.message ?? "Failed to update status.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const profilePayload = () => ({
    name: editForm.name.trim() || undefined,
    email: editForm.email.trim() || undefined,
    phone: editForm.phone.trim() || undefined,
    address: editForm.address.trim() || undefined,
    accountType: editForm.accountType || undefined,
  });

  const hasEmailChanged = () => {
    if (!data) return false;
    return editForm.email.trim().toLowerCase() !== (data.user.email ?? "").trim().toLowerCase();
  };

  const submitProfileUpdate = async (confirmToken?: string) => {
    if (confirmToken) setEditReAuthOpen(false);
    setEditLoading(true);
    try {
      await authedJson(`/admin/users/${id}`, {
        method: "PATCH",
        ...(confirmToken ? { headers: { "X-Admin-Confirm-Token": confirmToken } } : {}),
        body: JSON.stringify(profilePayload()),
      });
      setEditOpen(false);
      setEditReAuthOpen(false);
      showToast("Customer profile updated.", "success");
      load();
    } catch (err: any) {
      setEditError(err.message ?? "Failed to update profile.");
    } finally {
      setEditLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (hasEmailChanged()) {
      setEditReAuthOpen(true);
      return;
    }
    await submitProfileUpdate();
  };

  const doArchive = async () => {
    if (!archiveConfirmToken) return;
    setArchiveLoading(true);
    setArchiveError("");
    try {
      await authedJson(`/admin/users/${id}/archive`, {
        method: "POST",
        headers: { "X-Admin-Confirm-Token": archiveConfirmToken },
        body: JSON.stringify({ reason: archiveReason.trim() }),
      });
      setArchiveOpen(false);
      setArchiveConfirmToken(null);
      setArchiveReason("");
      showToast("Customer archived. All sessions revoked.", "success");
      load();
    } catch (err: any) {
      setArchiveError(err.message ?? "Failed to archive customer.");
    } finally {
      setArchiveLoading(false);
    }
  };

  const isArchived = !!data?.user.archivedAt;

  return (
    <>
      <PageMeta title="Customer detail — Admin — MevrelBank" description="Customer account detail for MevrelBank support staff." />

      {editReAuthOpen && (
        <AdminReAuthModal
          title="Change customer email"
          description="Changing a customer's email revokes active sessions and marks the email as unverified. Confirm your admin identity to save this change."
          onClose={() => {
            setEditReAuthOpen(false);
            setEditLoading(false);
          }}
          onConfirm={(token) => submitProfileUpdate(token)}
        />
      )}

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-[10px] text-[13px] font-semibold shadow-lg text-white flex items-center gap-2 ${toast.type === "success" ? "bg-[#0E7C4D]" : "bg-[#C52B2B]"}`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Archive re-auth flow: step 1 = password gate, step 2 = reason + confirm */}
      {archiveOpen && !archiveConfirmToken && (
        <AdminReAuthModal
          title="Archive customer"
          description="Archiving deactivates the customer and revokes all sessions. This cannot be undone from the UI. Confirm your admin identity to continue."
          onClose={() => setArchiveOpen(false)}
          onConfirm={(token) => setArchiveConfirmToken(token)}
        />
      )}

      {archiveOpen && archiveConfirmToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>
                Confirm archival
              </h3>
              <button onClick={() => { setArchiveOpen(false); setArchiveConfirmToken(null); }} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={16} /></button>
            </div>
            <p className="text-[13px] text-[#5E6E8E] mb-4">
              <strong>{data?.user.name}</strong> will be deactivated and all active sessions revoked. Their data will be retained.
            </p>
            {archiveError && (
              <div className="rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.2)] px-3 py-2 text-[12px] text-[#C52B2B] mb-3">{archiveError}</div>
            )}
            <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">
              Reason <span className="text-[#C52B2B]">*</span>
            </label>
            <textarea
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              rows={3}
              placeholder="e.g. Customer requested account closure."
              className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setArchiveOpen(false); setArchiveConfirmToken(null); }}
                className="flex-1 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-[#F4F7FB] transition-colors">
                Cancel
              </button>
              <button onClick={doArchive} disabled={archiveLoading || !archiveReason.trim()}
                className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#C52B2B] text-white text-[13px] font-semibold hover:bg-[#a82424] disabled:opacity-60 transition-colors">
                {archiveLoading ? "Archiving…" : "Archive customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link to="/admin/customers" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0B3270] hover:text-[#0E3E8C] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to customers
      </Link>

      {error && (
        <div className="rounded-[10px] border border-[rgba(197,43,43,0.18)] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#C52B2B] mb-6">
          {error}
        </div>
      )}

      {!data ? (
        <p className="text-[14px] text-[#5E6E8E]">Loading…</p>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
                  {data.user.name}
                </h1>
                {isArchived && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#C52B2B]">
                    ARCHIVED
                  </span>
                )}
              </div>
              <p className="text-[14px] text-[#5E6E8E] mt-1">{data.user.email}</p>
              {data.user.phone && <p className="text-[13px] text-[#9AAABF] mt-0.5">{data.user.phone}</p>}
              {isArchived && data.user.archiveReason && (
                <p className="text-[12px] text-[#C52B2B] mt-1">Reason: {data.user.archiveReason}</p>
              )}
              {isArchived && data.user.archivedByName && (
                <p className="text-[11px] text-[#9AAABF] mt-0.5">Archived by {data.user.archivedByName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setEditOpen((o) => !o)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#0B3270] hover:bg-[#EBF0FA] transition-colors"
              >
                <Pencil size={14} />
                Edit profile
                {editOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {!isArchived && (
                <button
                  onClick={toggleActive}
                  disabled={updating}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                    data.user.isActive
                      ? "bg-[#FEF2F2] text-[#C52B2B] hover:bg-[#FDE8E8]"
                      : "bg-[#D6F0E6] text-[#0A5E3A] hover:bg-[#c3e9d8]"
                  }`}
                >
                  {data.user.isActive ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
                  {data.user.isActive ? "Suspend" : "Reactivate"}
                </button>
              )}
              {!isArchived && (
                <button
                  onClick={() => setArchiveOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#FEF2F2] text-[#C52B2B] hover:bg-[#FDE8E8] text-[13px] font-semibold transition-colors"
                >
                  <Archive size={14} />
                  Archive
                </button>
              )}
            </div>
          </div>

          {/* Edit profile form */}
          {editOpen && (
            <form onSubmit={saveProfile} className="rounded-[16px] border border-[#0B3270] border-opacity-20 bg-[#F7F9FD] p-5 mb-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[14px] font-bold text-[#0D1829]">Edit customer profile</h3>
                <button type="button" onClick={() => { setEditOpen(false); setEditError(""); setEditReAuthOpen(false); }} className="text-[#9AAABF] hover:text-[#5E6E8E]"><X size={15} /></button>
              </div>
              {editError && (
                <div className="rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.2)] px-3 py-2 text-[12px] text-[#C52B2B]">{editError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Full name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Email address</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] bg-white" />
                  <p className="text-[10px] text-[#B46A0A] mt-0.5">Changing email revokes active sessions and marks email as unverified.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Account type</label>
                  <select value={editForm.accountType} onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] bg-white">
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#8A9BBE] mb-1">Address</label>
                  <textarea value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={2} className="w-full px-3 py-2 rounded-[8px] border border-[rgba(11,50,112,0.15)] text-[13px] outline-none focus:border-[#0B3270] bg-white resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setEditOpen(false); setEditError(""); setEditReAuthOpen(false); }}
                  className="px-5 py-2.5 rounded-[10px] border border-[rgba(11,50,112,0.15)] text-[13px] font-semibold text-[#5E6E8E] hover:bg-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0d3d8a] disabled:opacity-60 transition-colors">
                  <Check size={14} />
                  {editLoading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {/* Info tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Field label="Account type" value={<span className="capitalize">{data.user.accountType}</span>} />
            <Field label="Email verified" value={data.user.emailVerified ? "Yes" : "No"} />
            <Field label="2FA enabled" value={data.user.totpEnabled ? "Yes" : "No"} />
            <Field label="Joined" value={new Date(data.user.createdAt).toLocaleDateString()} />
            {data.user.address && (
              <div className="col-span-2 sm:col-span-4 rounded-[14px] border border-[rgba(11,50,112,0.08)] bg-white p-4">
                <p className="text-[12px] text-[#9AAABF]">Address</p>
                <p className="text-[14px] font-semibold text-[#0D1829] mt-1 whitespace-pre-line">{data.user.address}</p>
              </div>
            )}
          </div>

          {/* Accounts */}
          <h2 className="text-[16px] font-bold text-[#0D1829] mb-3">Accounts</h2>
          <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden mb-8">
            {data.accounts.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[#5E6E8E]">No accounts.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(11,50,112,0.07)] text-[12px] uppercase tracking-[0.04em] text-[#9AAABF]">
                    <th className="px-5 py-3.5 font-semibold">Account</th>
                    <th className="px-5 py-3.5 font-semibold">Routing / number</th>
                    <th className="px-5 py-3.5 font-semibold">Balance</th>
                    <th className="px-5 py-3.5 font-semibold">Available</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accounts.map((a) => (
                    <tr key={a.id} className="border-b border-[rgba(11,50,112,0.05)] last:border-0">
                      <td className="px-5 py-4 text-[14px] font-medium text-[#0D1829]">{a.name}</td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{a.routingNumber} · {a.accountNumber}</td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-[#0D1829]">{currency(a.balance)}</td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{currency(a.available)}</td>
                      <td className="px-5 py-4">
                        {a.status === "closed" ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F7FB] text-[#9AAABF]">Closed</span>
                            {a.closedAt && (
                              <p className="text-[10px] text-[#9AAABF] mt-0.5">{new Date(a.closedAt).toLocaleDateString()}</p>
                            )}
                            {a.closedByName && (
                              <p className="text-[10px] text-[#9AAABF]">by {a.closedByName}</p>
                            )}
                            {a.closeReason && (
                              <p className="text-[10px] text-[#5E6E8E] mt-0.5 max-w-[180px] truncate" title={a.closeReason}>"{a.closeReason}"</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D6F0E6] text-[#0E7C4D]">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Transactions */}
          <h2 className="text-[16px] font-bold text-[#0D1829] mb-3">Recent transactions</h2>
          <div className="rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden">
            {data.transactions.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-[#5E6E8E]">No transactions.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(11,50,112,0.07)] text-[12px] uppercase tracking-[0.04em] text-[#9AAABF]">
                    <th className="px-5 py-3.5 font-semibold">Description</th>
                    <th className="px-5 py-3.5 font-semibold">Account</th>
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Amount</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t) => (
                    <tr key={t.id} className="border-b border-[rgba(11,50,112,0.05)] last:border-0">
                      <td className="px-5 py-4">
                        <div className="text-[14px] text-[#0D1829]">{t.name}</div>
                        {t.adminReason && (
                          <div className="text-[10px] text-[#5E6E8E] mt-0.5 italic max-w-[200px] truncate"
                               title={`${t.adminReason}${t.adminName ? ` — ${t.adminName}` : ""}`}>
                            ↳ {t.adminReason}{t.adminName ? ` — ${t.adminName}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E]">{t.account}</td>
                      <td className="px-5 py-4"><TxTypeBadge type={t.txType} /></td>
                      <td className={`px-5 py-4 text-[13px] font-semibold ${t.amount < 0 ? "text-[#C52B2B]" : "text-[#0E7C4D]"}`}>
                        {currency(t.amount)}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#5E6E8E] capitalize">{t.status}</td>
                      <td className="px-5 py-4 text-[13px] text-[#9AAABF]">{new Date(t.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
