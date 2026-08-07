import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { FileText, Download } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { Btn } from "../shared/Btn";
import { useAuth } from "../../context/AuthContext";
import { bankingApi, type Statement } from "../shared/bankingApi";
import { applyRowHighlight } from "../services/notificationActionResolver";

export default function StatementsPage() {
  const { authedFetch } = useAuth();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let active = true;
    bankingApi.getStatements(authedFetch)
      .then((r) => {
        if (!active) return;
        setStatements(r.statements);
        const highlightId = searchParams.get("highlight");
        if (highlightId) applyRowHighlight(highlightId);
      })
      .catch(() => active && setError("Couldn't load your statements. Please try again."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [authedFetch, searchParams]);

  async function handleDownload(s: Statement) {
    setDownloadingId(s.id);
    setError(null);
    try {
      await bankingApi.downloadStatement(authedFetch, s.id, `mevrelbank-${s.account.replace(/\s+/g, "-").toLowerCase()}-${s.period.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch {
      setError("Couldn't download that statement. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <PageMeta title="Statements — MevrelBank" description="Download your monthly and quarterly MevrelBank statements." />
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Statements</h1>
        <div className="text-[12px] text-[#8A9BBE]">Generated automatically at the end of each period</div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[8px] bg-[#FBE9E7] text-[#9A2C1D] text-[12px] font-medium">{error}</div>
      )}

      <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden">
        {statements.map((s, i) => (
          <div
            key={s.id}
            data-entity-id={s.id}
            className={`flex items-center gap-3.5 px-5 py-3.5 ${i < statements.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} hover:bg-[#F8FAFD] transition-colors`}
          >
            <div className="w-8 h-8 rounded-[7px] bg-[#EBF0FA] flex items-center justify-center text-[#0B3270] flex-shrink-0">
              <FileText size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[#0D1829]">{s.period} — {s.account}</div>
              <div className="text-[10px] text-[#8A9BBE]">Generated {new Date(s.generated).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · PDF</div>
            </div>
            <Btn variant="ghost" size="sm" icon={<Download size={12} />} disabled={!s.fileUrl || downloadingId === s.id} onClick={() => handleDownload(s)}>
              {downloadingId === s.id ? "Downloading…" : "Download"}
            </Btn>
          </div>
        ))}
        {!loading && statements.length === 0 && (
          <div className="px-5 py-10 text-center text-[12px] text-[#8A9BBE]">No statements have been generated yet.</div>
        )}
      </div>
    </>
  );
}
