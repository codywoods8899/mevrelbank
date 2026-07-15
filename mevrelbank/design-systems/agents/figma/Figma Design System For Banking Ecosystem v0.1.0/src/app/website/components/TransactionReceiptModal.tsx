import { useEffect, useRef } from "react";
import { X, ArrowDownLeft, ArrowUpRight, ImageDown, FileDown } from "lucide-react";
import type { Transaction } from "../shared/bankingApi";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Canvas receipt (image download) ─────────────────────────────────────────

function downloadAsImage(tx: Transaction) {
  const DPR = 2;
  const W = 580, H = 480;
  const canvas = document.createElement("canvas");
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  function roundRect(x: number, y: number, w: number, h: number, r: number, fill: string) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function roundRectTop(x: number, y: number, w: number, h: number, r: number, fill: string) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  const isCredit = tx.amount > 0;
  const CX = 32, CY = 24, CW = W - 64, CH = H - 48;

  // Outer page bg
  ctx.fillStyle = "#F4F7FB";
  ctx.fillRect(0, 0, W, H);

  // Card
  roundRect(CX, CY, CW, CH, 14, "#ffffff");

  // Navy header
  roundRectTop(CX, CY, CW, 76, 14, "#0B3270");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("MEVRELBANK", CX + 20, CY + 27);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("Transaction Receipt", CX + 20, CY + 48);
  // small date top-right
  ctx.textAlign = "right";
  ctx.fillText(new Date(tx.date).toLocaleDateString("en-GB"), CX + CW - 20, CY + 48);

  // Amount block
  ctx.textAlign = "center";
  ctx.fillStyle = isCredit ? "#0E7C4D" : "#0D1829";
  ctx.font = `bold 34px "DM Mono", ui-monospace, monospace`;
  const sign = isCredit ? "+" : "-";
  ctx.fillText(`${sign}$${Math.abs(tx.amount).toFixed(2)}`, W / 2, CY + 128);

  ctx.fillStyle = "#0D1829";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(tx.name, W / 2, CY + 152);

  // Divider
  ctx.strokeStyle = "rgba(11,50,112,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CX + 20, CY + 172);
  ctx.lineTo(CX + CW - 20, CY + 172);
  ctx.stroke();

  // Details rows
  const rows: [string, string][] = [
    ["Date", formatDate(tx.date)],
    ["Category", tx.category],
    ["Account", tx.account],
    ["Status", capitalize(tx.status)],
    ["Reference", tx.id],
  ];

  rows.forEach(([label, value], i) => {
    const ry = CY + 200 + i * 30;
    ctx.textAlign = "left";
    ctx.fillStyle = "#8A9BBE";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText(label.toUpperCase(), CX + 26, ry);
    ctx.fillStyle = "#0D1829";
    ctx.font = label === "Reference" ? `11px "DM Mono", monospace` : "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(value, CX + CW - 26, ry);
    // row divider
    if (i < rows.length - 1) {
      ctx.strokeStyle = "rgba(11,50,112,0.04)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(CX + 20, ry + 10);
      ctx.lineTo(CX + CW - 20, ry + 10);
      ctx.stroke();
    }
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(11,50,112,0.35)";
  ctx.font = "9px system-ui, sans-serif";
  ctx.fillText("MevrelBank · mevrelbank.com · Official transaction receipt", W / 2, CY + CH - 14);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mevrelbank-receipt-${tx.id.slice(0, 12)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ─── PDF receipt (print popup) ───────────────────────────────────────────────

function downloadAsPdf(tx: Transaction) {
  const isCredit = tx.amount > 0;
  const amountColor = isCredit ? "#0E7C4D" : "#0D1829";
  const statusColor =
    tx.status === "completed" ? "#0E7C4D" : tx.status === "pending" ? "#B46A0A" : "#C52B2B";

  const rows: [string, string][] = [
    ["Date", formatDate(tx.date)],
    ["Category", tx.category],
    ["Account", tx.account],
    ["Status", capitalize(tx.status)],
    ["Reference", tx.id],
    ["Issued on", formatDate(new Date().toISOString())],
  ];

  const rowsHtml = rows
    .map(
      ([l, v]) =>
        `<div class="row"><span class="lbl">${l}</span><span class="val${l === "Reference" ? " mono" : ""}${l === "Status" ? `" style="color:${statusColor}` : ""}">${v}</span></div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Transaction Receipt — MevrelBank</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #F4F7FB; padding: 40px 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .card { background: #fff; border-radius: 16px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(11,50,112,0.10); }
    .header { background: #0B3270; color: #fff; padding: 22px 26px 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 16px; font-weight: 800; letter-spacing: 0.06em; }
    .header .sub { font-size: 11px; opacity: 0.65; margin-top: 4px; }
    .header .dt { font-size: 11px; opacity: 0.65; }
    .amount-block { text-align: center; padding: 26px 24px 20px; border-bottom: 1px solid rgba(11,50,112,0.07); }
    .amount { font-family: "DM Mono", ui-monospace, monospace; font-size: 38px; font-weight: 700; color: ${amountColor}; line-height: 1; }
    .desc { font-size: 14px; font-weight: 600; color: #0D1829; margin-top: 8px; }
    .details { padding: 6px 26px 22px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid rgba(11,50,112,0.05); }
    .row:last-child { border-bottom: none; }
    .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #8A9BBE; font-weight: 600; }
    .val { font-size: 12px; color: #0D1829; font-weight: 500; }
    .mono { font-family: "DM Mono", ui-monospace, monospace; font-size: 11px; }
    .footer { background: #F4F7FB; text-align: center; padding: 12px; font-size: 9.5px; color: #8A9BBE; letter-spacing: 0.02em; }
    @media print {
      body { background: #fff; padding: 0; }
      .card { box-shadow: none; border-radius: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div><div class="h1" style="font-size:16px;font-weight:800;letter-spacing:.06em;color:#fff;">MEVRELBANK</div><div class="sub">Transaction Receipt</div></div>
      <div class="dt">${new Date(tx.date).toLocaleDateString("en-GB")}</div>
    </div>
    <div class="amount-block">
      <div class="amount">${isCredit ? "+" : "-"}$${Math.abs(tx.amount).toFixed(2)}</div>
      <div class="desc">${tx.name}</div>
    </div>
    <div class="details">${rowsHtml}</div>
    <div class="footer">MevrelBank &middot; mevrelbank.com &middot; Official transaction receipt</div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 350); };<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Modal component ──────────────────────────────────────────────────────────

interface Props {
  tx: Transaction;
  onClose: () => void;
}

export function TransactionReceiptModal({ tx, onClose }: Props) {
  const isCredit = tx.amount > 0;
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent scroll on body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative w-full sm:max-w-sm bg-white sm:rounded-[18px] rounded-t-[20px] overflow-hidden shadow-2xl flex flex-col">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={14} className="text-white" />
        </button>

        {/* Navy header */}
        <div className="bg-[#0B3270] px-5 pt-5 pb-5">
          <div className="text-[12px] font-bold tracking-[0.14em] text-white uppercase">MevrelBank</div>
          <div className="text-[10px] text-white/60 mt-0.5">Transaction Receipt</div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center pt-6 pb-5 border-b border-[rgba(11,50,112,0.07)]">
          <div
            className="text-[36px] font-bold leading-none"
            style={{
              fontFamily: "'DM Mono', monospace",
              color: isCredit ? "#0E7C4D" : "#0D1829",
            }}
          >
            {isCredit ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
          </div>
          <div className="mt-2 text-[13px] font-semibold text-[#0D1829]">{tx.name}</div>
          <div className="mt-1 text-[11px] text-[#8A9BBE]">
            {isCredit ? "Money received" : "Money sent"}
          </div>
        </div>

        {/* Detail rows */}
        <div className="px-5 py-3 flex flex-col gap-0">
          {(
            [
              ["Date", formatDate(tx.date)],
              ["Category", tx.category],
              ["Account", tx.account],
              [
                "Status",
                <span
                  className="flex items-center gap-1.5"
                  style={{
                    color:
                      tx.status === "completed"
                        ? "#0E7C4D"
                        : tx.status === "pending"
                          ? "#B46A0A"
                          : "#C52B2B",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                    style={{
                      background:
                        tx.status === "completed"
                          ? "#0E7C4D"
                          : tx.status === "pending"
                            ? "#B46A0A"
                            : "#C52B2B",
                    }}
                  />
                  {capitalize(tx.status)}
                </span>,
              ],
              ["Reference", <span className="font-mono text-[10.5px] text-[#5E6E8E]">{tx.id}</span>],
            ] as [string, React.ReactNode][]
          ).map(([label, value], i, arr) => (
            <div
              key={label}
              className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-[rgba(11,50,112,0.05)]" : ""}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A9BBE]">
                {label}
              </span>
              <span className="text-[12px] font-medium text-[#0D1829] text-right max-w-[60%] truncate">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Share buttons */}
        <div className="px-5 pb-5 pt-2 flex gap-2.5 border-t border-[rgba(11,50,112,0.06)] mt-1">
          <button
            onClick={() => downloadAsImage(tx)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#EBF0FA] hover:bg-[#DDEAFF] transition-colors text-[12px] font-semibold text-[#0B3270]"
          >
            <ImageDown size={14} />
            Save as Image
          </button>
          <button
            onClick={() => downloadAsPdf(tx)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#0B3270] hover:bg-[#0a2d65] transition-colors text-[12px] font-semibold text-white"
          >
            <FileDown size={14} />
            Save as PDF
          </button>
        </div>

      </div>
    </div>
  );
}
