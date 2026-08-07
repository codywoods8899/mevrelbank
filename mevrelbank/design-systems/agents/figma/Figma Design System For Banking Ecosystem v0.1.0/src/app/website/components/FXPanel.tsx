import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import { fxApi, type FxRatesResponse, type Account } from "../shared/bankingApi";
import { CURRENCY_META, formatAmount } from "../shared/currencyUtils";

type AuthedFetch = (path: string, options?: RequestInit) => Promise<Response>;

interface FXPanelProps {
  accounts: Account[];
  authedFetch: AuthedFetch;
}

export function FXPanel({ accounts, authedFetch }: FXPanelProps) {
  const [data, setData] = useState<FxRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fxApi
      .getRates(authedFetch)
      .then((r) => setData(r))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // Total USD-equivalent balance (base reference)
  const totalUSD = accounts.reduce((sum, a) => {
    if (!data) return sum;
    const rate = data.rates[a.currency];
    const inUSD = rate ? a.balance * rate.mid : a.balance;
    return sum + inUSD;
  }, 0);

  const rows = data ? Object.values(data.rates) : [];

  return (
    <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(11,50,112,0.05)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[5px] bg-[#EBF0FA] flex items-center justify-center text-[#0B3270]">
            <TrendingUp size={12} />
          </div>
          <span className="text-[13px] font-semibold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>
            FX Rates
          </span>
          {data && (
            <span className="text-[10px] text-[#9AAABF] ml-1">
              {data.date}
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-[#9AAABF] hover:text-[#5E6E8E] transition-colors disabled:opacity-40"
          aria-label="Refresh rates"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="px-5 py-4 text-[12px] text-[#C52B2B]">Could not load FX rates.</div>
      )}

      {!error && (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-4 gap-2 px-5 py-2 bg-[#F8FAFD] border-b border-[rgba(11,50,112,0.04)]">
            <div className="text-[9px] font-semibold tracking-[0.1em] uppercase text-[#9AAABF]">Currency</div>
            <div className="text-[9px] font-semibold tracking-[0.1em] uppercase text-[#9AAABF] text-right">Bank Buys</div>
            <div className="text-[9px] font-semibold tracking-[0.1em] uppercase text-[#9AAABF] text-right">Bank Sells</div>
            <div className="text-[9px] font-semibold tracking-[0.1em] uppercase text-[#9AAABF] text-right">Your Balance</div>
          </div>

          {loading && (
            <div className="px-5 py-6 text-center text-[12px] text-[#9AAABF]">Loading rates…</div>
          )}

          {!loading && rows.map((rate) => {
            const meta = CURRENCY_META[rate.code as keyof typeof CURRENCY_META];

            // Calculate what the customer's balances are worth in this currency
            const balanceInThisCurrency = accounts.reduce((sum, acc) => {
              if (acc.currency === rate.code) {
                // Already in this currency
                return sum + acc.balance;
              }
              // Convert: first to USD, then to target currency
              const accRateToUSD = acc.currency === 'USD' ? 1 : (data?.rates[acc.currency]?.mid ?? 1);
              const usdValue = acc.balance * accRateToUSD;
              return sum + usdValue / rate.mid;
            }, 0);

            const hasBalance = accounts.some(
              (a) => a.currency === rate.code || a.balance > 0
            );

            return (
              <div
                key={rate.code}
                className="grid grid-cols-4 gap-2 px-5 py-2.5 border-b border-[rgba(11,50,112,0.04)] last:border-0 hover:bg-[#F8FAFD] transition-colors"
              >
                {/* Currency name */}
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{meta?.flag ?? '🌐'}</span>
                  <div>
                    <div className="text-[11px] font-semibold text-[#0D1829]">{rate.code}</div>
                    <div className="text-[9px] text-[#9AAABF]">{meta?.name ?? rate.code}</div>
                  </div>
                </div>

                {/* Bank buys (customer sells) */}
                <div className="text-right">
                  <div className="text-[11px] font-medium text-[#0D1829]" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {rate.buy.toFixed(4)}
                  </div>
                  <div className="text-[9px] text-[#9AAABF]">per {rate.code}</div>
                </div>

                {/* Bank sells (customer buys) */}
                <div className="text-right">
                  <div className="text-[11px] font-medium text-[#C52B2B]" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {rate.sell.toFixed(4)}
                  </div>
                  <div className="text-[9px] text-[#9AAABF]">per {rate.code}</div>
                </div>

                {/* Customer's balance converted to this currency */}
                <div className="text-right">
                  {hasBalance && accounts.some((a) => a.balance > 0) ? (
                    <div>
                      <div className="text-[11px] font-semibold text-[#0B3270]" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {formatAmount(balanceInThisCurrency, rate.code)}
                      </div>
                      <div className="text-[9px] text-[#9AAABF]">est. value</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#C8D4E8]">—</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer note */}
          {!loading && (
            <div className="px-5 py-2.5 bg-[#F8FAFD] border-t border-[rgba(11,50,112,0.04)]">
              <p className="text-[9px] text-[#B0BFCE] leading-relaxed">
                Indicative rates only. Rates shown include a bank spread. "Bank Sells" = rate you pay to buy foreign currency. "Bank Buys" = rate you receive when selling. Your balance estimate uses today's mid-market rate.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
