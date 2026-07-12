import { useEffect, useState } from "react";
import { Users, SendHorizontal, Plus, X, Trash2 } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";
import { bankingApi, type Beneficiary } from "../shared/bankingApi";

export default function BeneficiariesPage() {
  const { authedFetch } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nickname: "", sortCode: "", accountNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    bankingApi.getBeneficiaries(authedFetch)
      .then((r) => setBeneficiaries(r.beneficiaries))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [authedFetch]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await bankingApi.addBeneficiary(authedFetch, {
        name: form.name.trim(),
        nickname: form.nickname.trim() || undefined,
        sortCode: form.sortCode.trim(),
        accountNumber: form.accountNumber.trim(),
      });
      setForm({ name: "", nickname: "", sortCode: "", accountNumber: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message ?? "Could not add payee.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    await bankingApi.removeBeneficiary(authedFetch, id).catch(() => {});
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <>
      <PageMeta title="Beneficiaries — MevrelBank" description="Manage saved payees and send money from your MevrelBank account." />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Beneficiaries</h1>
          <div className="text-[12px] text-[#8A9BBE]">{loading ? "Loading…" : `${beneficiaries.length} saved payees`}</div>
        </div>
        <Btn size="sm" icon={showForm ? <X size={13} /> : <Plus size={13} />} onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "New Payee"}
        </Btn>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input required placeholder="Full name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]" />
            <input placeholder="Nickname (optional)" value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              className="px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]" />
            <input required placeholder="Sort code (00-00-00)" value={form.sortCode}
              onChange={(e) => setForm((f) => ({ ...f, sortCode: e.target.value }))}
              className="px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]" />
            <input required placeholder="Account number" value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              className="px-3 py-2 rounded-[6px] border border-[rgba(11,50,112,0.15)] text-[12px] outline-none focus:border-[#0B3270]" />
          </div>
          {error && <div className="text-[11px] text-[#C52B2B] mb-3">{error}</div>}
          <Btn size="sm" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Payee"}</Btn>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3">
        {beneficiaries.map((b) => (
          <div key={b.id} className="p-4 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EBF0FA] flex items-center justify-center text-[#0B3270] flex-shrink-0">
              <Users size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0D1829] truncate">{b.nickname ?? b.name}</div>
              {b.nickname && <div className="text-[10px] text-[#8A9BBE] truncate">{b.name}</div>}
              <div className="text-[10px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>
                {b.sortCode} · {b.accountNumber}
              </div>
            </div>
            <Btn variant="outline" size="sm" icon={<SendHorizontal size={12} />} disabled>Pay</Btn>
            <button onClick={() => handleRemove(b.id)} className="text-[#8A9BBE] hover:text-[#C52B2B] p-1.5 flex-shrink-0" aria-label="Remove payee">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {!loading && beneficiaries.length === 0 && (
          <div className="col-span-2 px-5 py-10 text-center text-[12px] text-[#8A9BBE] bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
            No saved payees yet. Add one to get started.
          </div>
        )}
      </div>
    </>
  );
}
