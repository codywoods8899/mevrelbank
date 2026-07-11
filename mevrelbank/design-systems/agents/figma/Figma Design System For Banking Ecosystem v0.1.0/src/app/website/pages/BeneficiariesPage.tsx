import { Users, SendHorizontal, Plus } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { beneficiaries } from "../shared/mockBankingData";

export default function BeneficiariesPage() {
  return (
    <>
      <PageMeta title="Beneficiaries — MevrelBank" description="Manage saved payees and send money from your MevrelBank account." />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Beneficiaries</h1>
          <div className="text-[12px] text-[#8A9BBE]">{beneficiaries.length} saved payees</div>
        </div>
        <Btn size="sm" icon={<Plus size={13} />}>New Payee</Btn>
      </div>

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
            <Btn variant="outline" size="sm" icon={<SendHorizontal size={12} />}>Pay</Btn>
          </div>
        ))}
      </div>
    </>
  );
}
