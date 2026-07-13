import { useState } from "react";
import type { ReactNode } from "react";
import {
  Search, CreditCard,
  TrendingUp, Shield, Lock, Eye, EyeOff, Check, X, AlertTriangle, Info,
  ChevronDown, ChevronRight, ChevronLeft, Download, Filter, Plus,
  MoreHorizontal, FileText, CheckCircle, XCircle,
  Loader2, Wallet, Activity, RefreshCw, Star, Globe,
  Zap, ArrowRight, Users
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { DashboardShell } from "./website/components/DashboardShell";
import { DashboardOverview } from "./website/components/DashboardOverview";

// ─── LOGO MARK ───────────────────────────────────────────────────────────────

function MevrelMark({ size = 40, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 40 48" fill="none" aria-hidden="true">
      {/* Back layer — deepest navy */}
      <path
        d="M3 8C3 4.8 5.4 2.5 8.5 2.5H13C24.5 2.5 30.5 12 30.5 24C30.5 36 24.5 45.5 13 45.5H8.5C5.4 45.5 3 43.2 3 40V8Z"
        fill={inverted ? "rgba(255,255,255,0.55)" : "#091E42"}
      />
      {/* Mid layer — brand blue */}
      <path
        d="M14 9.5C14 6.8 16.2 5 18.8 5H22C32.5 5 38 13.5 38 24C38 34.5 32.5 43 22 43H18.8C16.2 43 14 41.2 14 38.5V9.5Z"
        fill={inverted ? "rgba(255,255,255,0.78)" : "#1155A6"}
      />
      {/* Front layer — sky blue highlight */}
      <path
        d="M23 16C23 13.5 25.2 12 27.5 12H29.5C37 12 41 18.5 41 26C41 33.5 37 40 29.5 40H27.5C25.2 40 23 38.5 23 36V16Z"
        fill={inverted ? "#FFFFFF" : "#4AA2D8"}
      />
    </svg>
  );
}

function MevrelLogo({ inverted = false, size = "md", className = "" }: { inverted?: boolean; size?: "sm" | "md" | "lg"; className?: string }) {
  const markSize = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const nameSize = size === "sm" ? "text-[14px]" : size === "lg" ? "text-[22px]" : "text-[17px]";
  const tagSize = size === "sm" ? "text-[8px]" : "text-[9px]";
  const gap = size === "sm" ? "gap-2" : "gap-3";
  return (
    <div className={`flex items-center ${gap} select-none ${className}`}>
      <MevrelMark size={markSize} inverted={inverted} />
      <div>
        <div
          className={`${nameSize} font-bold tracking-[0.09em] leading-none`}
          style={{ fontFamily: "Figtree, sans-serif", color: inverted ? "#FFFFFF" : "#0B3270" }}
        >
          MEVRELBANK
        </div>
        <div
          className={`${tagSize} tracking-[0.16em] uppercase mt-1 leading-none`}
          style={{ color: inverted ? "rgba(255,255,255,0.45)" : "#8A9BBE" }}
        >
          Smarter Banking for a Modern Life
        </div>
      </div>
    </div>
  );
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const brandPalette = [
  { shade: "50",  hex: "#EEF4FC", light: true },
  { shade: "100", hex: "#D8E7F8", light: true },
  { shade: "200", hex: "#B0CFF0", light: true },
  { shade: "300", hex: "#7AABDF", light: true },
  { shade: "400", hex: "#4283CB", light: false },
  { shade: "500", hex: "#1764C0", light: false },
  { shade: "600", hex: "#1155A6", light: false },
  { shade: "700", hex: "#0D4086", light: false },
  { shade: "800", hex: "#0B2D6B", light: false },
  { shade: "900", hex: "#091E42", light: false },
];

const semanticColors = [
  { name: "Success",     hex: "#0E7C4D", bg: "#D6F0E6", fg: "#0A5E3A" },
  { name: "Warning",     hex: "#B46A0A", bg: "#FDF0D6", fg: "#7A4A00" },
  { name: "Destructive", hex: "#C52B2B", bg: "#FDE8E8", fg: "#8A1E1E" },
  { name: "Info",        hex: "#1155A6", bg: "#D8E7F8", fg: "#0B3270" },
  { name: "Neutral",     hex: "#5E6E8E", bg: "#E8EBF0", fg: "#3A4A62" },
];

// ─── CHART DATA ───────────────────────────────────────────────────────────────

const balanceTrend = [
  { month: "Jan", balance: 24800 },
  { month: "Feb", balance: 28500 },
  { month: "Mar", balance: 26200 },
  { month: "Apr", balance: 29400 },
  { month: "May", balance: 32100 },
  { month: "Jun", balance: 35600 },
  { month: "Jul", balance: 38240 },
];

const spendingData = [
  { month: "Jan", income: 8400, expenses: 5200 },
  { month: "Feb", income: 8400, expenses: 4800 },
  { month: "Mar", income: 9200, expenses: 6100 },
  { month: "Apr", income: 8400, expenses: 5400 },
  { month: "May", income: 10500, expenses: 6800 },
  { month: "Jun", income: 8400, expenses: 5100 },
  { month: "Jul", income: 9100, expenses: 5700 },
];

const transactions = [
  { id: 1,  name: "Waitrose Supermarket",       category: "Groceries",     date: "Today, 14:32",  amount: -86.40,  status: "completed" },
  { id: 2,  name: "Salary – Apex Solutions Ltd", category: "Income",        date: "Today, 09:00",  amount: 8400.00, status: "completed" },
  { id: 3,  name: "Netflix UK",                  category: "Entertainment", date: "Yesterday",     amount: -15.99,  status: "completed" },
  { id: 4,  name: "Transfer to J. Chen",         category: "Transfer",      date: "Yesterday",     amount: -500.00, status: "completed" },
  { id: 5,  name: "TfL Contactless",             category: "Transport",     date: "Mon 7 Jul",     amount: -4.80,   status: "completed" },
  { id: 6,  name: "Amazon.co.uk",                category: "Shopping",      date: "Mon 7 Jul",     amount: -34.99,  status: "pending"   },
  { id: 7,  name: "EDF Energy Direct Debit",     category: "Utilities",     date: "Sat 5 Jul",     amount: -89.00,  status: "completed" },
  { id: 8,  name: "Nando's Westfield",           category: "Dining",        date: "Fri 4 Jul",     amount: -28.50,  status: "completed" },
];

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type BtnSize = "sm" | "md" | "lg";

function Btn({
  variant = "primary", size = "md", children, icon, disabled = false,
  className = "", onClick,
}: {
  variant?: BtnVariant; size?: BtnSize; children?: ReactNode; icon?: ReactNode;
  disabled?: boolean; className?: string; onClick?: () => void;
}) {
  const base = "inline-flex items-center gap-2 font-semibold rounded-[6px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none whitespace-nowrap";
  const sizes: Record<BtnSize, string> = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-2.5 text-[13px]",
    lg: "px-6 py-3 text-[14px]",
  };
  const variants: Record<BtnVariant, string> = {
    primary:     "bg-[#0B3270] text-white hover:bg-[#0E3E8C] focus:ring-[#0B3270] active:bg-[#091E42]",
    secondary:   "bg-[#EBF0FA] text-[#0B3270] hover:bg-[#D8E7F8] focus:ring-[#0B3270]",
    outline:     "border border-[rgba(11,50,112,0.22)] text-[#0B3270] hover:border-[#0B3270] hover:bg-[#EBF0FA] focus:ring-[#0B3270]",
    ghost:       "text-[#0B3270] hover:bg-[#EBF0FA] focus:ring-[#0B3270]",
    destructive: "bg-[#C52B2B] text-white hover:bg-[#A82424] focus:ring-[#C52B2B]",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-40 pointer-events-none" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0 flex">{icon}</span>}
      {children}
    </button>
  );
}

function Bdg({
  label, variant = "default",
}: { label: string; variant?: "default" | "success" | "warning" | "error" | "info" | "neutral" | "pending" }) {
  const styles: Record<string, string> = {
    default: "bg-[#EBF0FA] text-[#0B3270]",
    success: "bg-[#D6F0E6] text-[#0A5E3A]",
    warning: "bg-[#FDF0D6] text-[#7A4A00]",
    error:   "bg-[#FDE8E8] text-[#8A1E1E]",
    info:    "bg-[#D8E7F8] text-[#0B3270]",
    neutral: "bg-[#E8EBF0] text-[#3A4A62]",
    pending: "bg-[#FDF0D6] text-[#7A4A00]",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-[0.03em] ${styles[variant]}`}>
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = { completed: "#0E7C4D", pending: "#B46A0A", failed: "#C52B2B" };
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c[status] ?? "#B8C5DD" }} />;
}

function SubTitle({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#8A9BBE] mb-4 mt-8 first:mt-0">
      {label}
    </div>
  );
}

// ─── SECTION: DESIGN SYSTEM ───────────────────────────────────────────────────

function DesignSystemView() {
  const [switchOn, setSwitchOn] = useState(true);
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);
  const [radioVal, setRadioVal] = useState("standard");
  const [showPw, setShowPw] = useState(false);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const navGroups = [
    {
      label: "Foundations",
      items: [
        { id: "colors",     label: "Color System" },
        { id: "typography", label: "Typography" },
        { id: "spacing",    label: "Spacing Scale" },
        { id: "radii",      label: "Radii & Elevation" },
      ],
    },
    {
      label: "Components",
      items: [
        { id: "buttons",    label: "Buttons" },
        { id: "forms",      label: "Form Controls" },
        { id: "cards",      label: "Cards" },
        { id: "badges",     label: "Badges & Alerts" },
        { id: "tables",     label: "Tables" },
        { id: "datadisplay",label: "Data Display" },
        { id: "charts",     label: "Charts" },
      ],
    },
  ];

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto bg-white border-r border-[rgba(11,50,112,0.07)]">
        <div className="py-6">
          {navGroups.map((g) => (
            <div key={g.label} className="mb-5">
              <div className="px-5 mb-2 text-[9px] font-semibold tracking-[0.2em] uppercase text-[#8A9BBE]">{g.label}</div>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="w-full text-left px-5 py-2.5 text-[13px] text-[#5E6E8E] hover:bg-[#F0F5FF] hover:text-[#0B3270] transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-10 pb-24 max-w-[900px]">

        {/* ── COLORS ── */}
        <section id="colors">
          <div className="pt-10 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Foundation 01</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Color System</h2>
            <p className="text-[13px] text-[#5E6E8E] mt-1 leading-relaxed">
              Anchored to the three-blue logomark. Every color decision extends from the brand's core palette.
            </p>
          </div>

          <SubTitle label="Brand Palette — Blue" />
          <div className="grid grid-cols-5 gap-2 mb-8 sm:grid-cols-10">
            {brandPalette.map((c) => (
              <div key={c.shade}>
                <div
                  className="h-12 rounded-[5px] mb-2"
                  style={{ backgroundColor: c.hex, border: c.shade === "50" ? "1px solid rgba(11,50,112,0.10)" : "none" }}
                />
                <div className="text-[11px] font-semibold text-[#3A4A62]">{c.shade}</div>
                <div className="text-[9px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>{c.hex}</div>
              </div>
            ))}
          </div>

          <SubTitle label="Semantic Colors" />
          <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-5">
            {semanticColors.map((c) => (
              <div key={c.name} className="p-3 bg-white rounded-[8px] border border-[rgba(11,50,112,0.07)]">
                <div className="h-8 rounded-[5px] mb-2.5" style={{ backgroundColor: c.hex }} />
                <div className="text-[12px] font-semibold text-[#0D1829]">{c.name}</div>
                <div className="text-[9px] text-[#8A9BBE] mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{c.hex}</div>
              </div>
            ))}
          </div>

          <SubTitle label="Surface & Semantic Tokens" />
          <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden mb-10">
            {[
              { token: "--background",      value: "#F4F7FB", role: "Page background" },
              { token: "--card",            value: "#FFFFFF",  role: "Cards, panels, dialogs" },
              { token: "--primary",         value: "#0B3270",  role: "Primary CTA, nav emphasis" },
              { token: "--accent",          value: "#1764C0",  role: "Links, focus rings, highlights" },
              { token: "--muted",           value: "#E4EAF5",  role: "Subdued surfaces, dividers" },
              { token: "--muted-foreground",value: "#5E6E8E",  role: "Labels, captions, metadata" },
              { token: "--destructive",     value: "#C52B2B",  role: "Errors, danger actions" },
              { token: "--border",          value: "rgba(11,50,112,0.10)", role: "Hairline dividers" },
            ].map((row, i, arr) => (
              <div
                key={row.token}
                className={`flex items-center gap-4 px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-[rgba(11,50,112,0.05)]" : ""}`}
              >
                <div
                  className="w-7 h-7 rounded-[4px] border border-[rgba(0,0,0,0.08)] flex-shrink-0"
                  style={{ backgroundColor: row.value }}
                />
                <div className="w-52 text-[12px] text-[#0B3270] flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {row.token}
                </div>
                <div className="text-[11px] text-[#8A9BBE] flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {row.value}
                </div>
                <div className="text-[12px] text-[#5E6E8E] ml-auto">{row.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TYPOGRAPHY ── */}
        <section id="typography">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Foundation 02</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Typography System</h2>
            <p className="text-[13px] text-[#5E6E8E] mt-1">Three typefaces. Clear hierarchy. Precision at every scale.</p>
          </div>

          <SubTitle label="Font Families" />
          <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
            {[
              { name: "Figtree", role: "Display / UI / Headings", sample: "Banking, built for life", size: "26px", weight: 700, family: "Figtree, sans-serif", note: "Geometric sans — confident, modern, premium. Used for all headings, wordmark, hero copy, and primary UI labels." },
              { name: "Inter",   role: "Body / Forms / Prose",    sample: "Manage your finances with clarity.", size: "17px", weight: 400, family: "Inter, sans-serif", note: "Universally readable sans. Body copy, form labels, help text, navigation, and all secondary UI text." },
              { name: "DM Mono", role: "Data / Numbers / Code",   sample: "$38,240.00", size: "22px", weight: 500, family: "'DM Mono', monospace", note: "Structured mono for account numbers, sort codes, amounts, IBAN, timestamps, and data tables." },
            ].map((f) => (
              <div key={f.name} className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
                <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#8A9BBE] mb-3">{f.name} — {f.role}</div>
                <div
                  className="text-[#0D1829] mb-3 leading-tight"
                  style={{ fontSize: f.size, fontWeight: f.weight, fontFamily: f.family }}
                >
                  {f.sample}
                </div>
                <div className="text-[11px] text-[#8A9BBE] leading-relaxed">{f.note}</div>
              </div>
            ))}
          </div>

          <SubTitle label="Type Scale" />
          <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden mb-10">
            {[
              { name: "Display XL",  px: "48px", lh: "1.04", wt: 800,  family: "Figtree", sample: "Financial clarity, delivered." },
              { name: "Display L",   px: "36px", lh: "1.10", wt: 700,  family: "Figtree", sample: "Smarter Banking for a Modern Life" },
              { name: "Heading 1",   px: "28px", lh: "1.20", wt: 700,  family: "Figtree", sample: "Account Overview" },
              { name: "Heading 2",   px: "22px", lh: "1.28", wt: 600,  family: "Figtree", sample: "Recent Transactions" },
              { name: "Heading 3",   px: "18px", lh: "1.35", wt: 600,  family: "Figtree", sample: "Savings Account" },
              { name: "Body L",      px: "17px", lh: "1.60", wt: 400,  family: "Inter",   sample: "Manage your finances with confidence and clarity." },
              { name: "Body",        px: "15px", lh: "1.60", wt: 400,  family: "Inter",   sample: "Transfer funds, view statements, and set up direct debits with ease." },
              { name: "Body S",      px: "13px", lh: "1.55", wt: 400,  family: "Inter",   sample: "Last updated 08 Jul 2026 at 14:32" },
              { name: "Caption",     px: "11px", lh: "1.50", wt: 400,  family: "Inter",   sample: "Fields marked with an asterisk (*) are required" },
              { name: "Label",       px: "10px", lh: "1.40", wt: 600,  family: "Inter",   sample: "ACCOUNT NUMBER · SORT CODE · BIC/SWIFT" },
              { name: "Mono L",      px: "20px", lh: "1.30", wt: 500,  family: "DM Mono", sample: "$38,240.00" },
              { name: "Mono",        px: "14px", lh: "1.40", wt: 400,  family: "DM Mono", sample: "40-12-34 · 12345678" },
              { name: "Mono S",      px: "11px", lh: "1.40", wt: 400,  family: "DM Mono", sample: "GB29NWBK60161331926819" },
            ].map((t, i, arr) => (
              <div key={t.name} className={`flex items-baseline gap-5 px-5 py-4 ${i < arr.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""}`}>
                <div className="w-20 flex-shrink-0 text-[11px] text-[#8A9BBE]">{t.name}</div>
                <div className="w-28 flex-shrink-0 text-[10px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {t.px} / {t.wt} / {t.lh}
                </div>
                <div
                  className="flex-1 min-w-0 text-[#0D1829] truncate"
                  style={{
                    fontSize: t.px,
                    fontWeight: t.wt,
                    lineHeight: t.lh,
                    fontFamily: t.family === "DM Mono" ? "'DM Mono', monospace" : t.family === "Figtree" ? "Figtree, sans-serif" : "Inter, sans-serif",
                    textTransform: t.name === "Label" ? "uppercase" : undefined,
                    letterSpacing: t.name === "Label" ? "0.12em" : undefined,
                  }}
                >
                  {t.sample}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SPACING ── */}
        <section id="spacing">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Foundation 03</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Spacing Scale</h2>
            <p className="text-[13px] text-[#5E6E8E] mt-1">4px base unit. All spacing is a multiple of 4, with the primary rhythm at 8px.</p>
          </div>
          <div className="space-y-3 mb-10">
            {[
              { t: "1",  px: "4px",   tw: "space-1"  },
              { t: "2",  px: "8px",   tw: "space-2"  },
              { t: "3",  px: "12px",  tw: "space-3"  },
              { t: "4",  px: "16px",  tw: "space-4"  },
              { t: "5",  px: "20px",  tw: "space-5"  },
              { t: "6",  px: "24px",  tw: "space-6"  },
              { t: "8",  px: "32px",  tw: "space-8"  },
              { t: "10", px: "40px",  tw: "space-10" },
              { t: "12", px: "48px",  tw: "space-12" },
              { t: "16", px: "64px",  tw: "space-16" },
              { t: "20", px: "80px",  tw: "space-20" },
              { t: "24", px: "96px",  tw: "space-24" },
            ].map((s) => (
              <div key={s.t} className="flex items-center gap-4">
                <div className="w-6 text-[11px] text-right text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>{s.t}</div>
                <div className="w-10 text-[11px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>{s.px}</div>
                <div className="flex-1 h-5 flex items-center">
                  <div className="h-5 rounded-[2px] bg-[#1764C0] opacity-[0.65]" style={{ width: s.px, minWidth: "2px" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RADII & ELEVATION ── */}
        <section id="radii">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Foundation 04</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Radii & Elevation</h2>
          </div>
          <SubTitle label="Border Radius Scale" />
          <div className="flex flex-wrap gap-6 mb-10">
            {[
              { name: "None",      r: "0",       px: "0" },
              { name: "XS",        r: "2px",     px: "2px" },
              { name: "SM",        r: "4px",     px: "4px" },
              { name: "Base",      r: "6px",     px: "6px" },
              { name: "LG",        r: "8px",     px: "8px" },
              { name: "XL",        r: "12px",    px: "12px" },
              { name: "2XL",       r: "16px",    px: "16px" },
              { name: "Full",      r: "9999px",  px: "full" },
            ].map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-2.5">
                <div
                  className="w-14 h-14 bg-[#1764C0] opacity-[0.75]"
                  style={{ borderRadius: r.r }}
                />
                <div className="text-[11px] font-semibold text-[#3A4A62]">{r.name}</div>
                <div className="text-[10px] text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>{r.px}</div>
              </div>
            ))}
          </div>
          <SubTitle label="Elevation System" />
          <div className="flex flex-wrap gap-8 mb-10">
            {[
              { name: "Flat",  shadow: "none" },
              { name: "XS",    shadow: "0 1px 2px rgba(11,50,112,0.06)" },
              { name: "SM",    shadow: "0 2px 6px rgba(11,50,112,0.08)" },
              { name: "MD",    shadow: "0 4px 14px rgba(11,50,112,0.10)" },
              { name: "LG",    shadow: "0 8px 24px rgba(11,50,112,0.12)" },
              { name: "XL",    shadow: "0 16px 40px rgba(11,50,112,0.14)" },
            ].map((e) => (
              <div key={e.name} className="flex flex-col items-center gap-3">
                <div
                  className="w-20 h-20 bg-white rounded-[8px]"
                  style={{ boxShadow: e.shadow, border: e.name === "Flat" ? "1px solid rgba(11,50,112,0.08)" : "none" }}
                />
                <div className="text-[11px] font-semibold text-[#3A4A62]">{e.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BUTTONS ── */}
        <section id="buttons">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 01</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Buttons</h2>
          </div>
          <SubTitle label="Variants" />
          <div className="flex flex-wrap gap-3 p-6 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] mb-4">
            <Btn variant="primary">Primary Action</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="outline">Outline</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="destructive">Destructive</Btn>
          </div>
          <SubTitle label="Sizes & States" />
          <div className="flex flex-wrap items-center gap-3 p-6 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] mb-4">
            <Btn size="sm">Small</Btn>
            <Btn size="md">Medium</Btn>
            <Btn size="lg">Large</Btn>
            <Btn disabled>Disabled</Btn>
            <Btn icon={<Plus size={13} />}>New Payee</Btn>
            <Btn variant="secondary" icon={<Download size={13} />}>Download</Btn>
            <Btn variant="outline" icon={<RefreshCw size={13} />}>Refresh</Btn>
            <Btn variant="destructive" icon={<X size={13} />}>Close Account</Btn>
          </div>
          <SubTitle label="Icon-Only Buttons" />
          <div className="flex items-center gap-3 p-6 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] mb-10">
            {[
              { icon: <Plus size={15} />,       v: "primary"     as BtnVariant, title: "Add" },
              { icon: <Download size={15} />,    v: "secondary"   as BtnVariant, title: "Download" },
              { icon: <Filter size={15} />,      v: "outline"     as BtnVariant, title: "Filter" },
              { icon: <RefreshCw size={15} />,   v: "ghost"       as BtnVariant, title: "Refresh" },
              { icon: <MoreHorizontal size={15} />, v: "ghost"    as BtnVariant, title: "More" },
            ].map((b) => (
              <button
                key={b.title}
                title={b.title}
                className={`w-9 h-9 flex items-center justify-center rounded-[6px] transition-all focus:outline-none focus:ring-2 focus:ring-[#1764C0] focus:ring-offset-1 ${
                  b.v === "primary" ? "bg-[#0B3270] text-white hover:bg-[#0E3E8C]" :
                  b.v === "secondary" ? "bg-[#EBF0FA] text-[#0B3270] hover:bg-[#D8E7F8]" :
                  b.v === "outline" ? "border border-[rgba(11,50,112,0.22)] text-[#0B3270] hover:bg-[#EBF0FA]" :
                  "text-[#5E6E8E] hover:bg-[#EBF0FA] hover:text-[#0B3270]"
                }`}
              >
                {b.icon}
              </button>
            ))}
          </div>
        </section>

        {/* ── FORMS ── */}
        <section id="forms">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 02</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Form Controls</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Text inputs */}
            <div className="p-6 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <SubTitle label="Text Inputs" />
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#3A4A62] mb-1.5">Account Name</label>
                  <input type="text" placeholder="Enter full legal name" className="w-full h-10 px-3.5 rounded-[6px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#3A4A62] mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} defaultValue="SecurePass2026!" className="w-full h-10 px-3.5 pr-10 rounded-[6px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8CAA] hover:text-[#0B3270]" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#C52B2B] mb-1.5">Sort Code <span className="text-[#C52B2B]">*</span></label>
                  <input type="text" defaultValue="40-12-3X" className="w-full h-10 px-3.5 rounded-[6px] bg-[#EEF2F9] border border-[#C52B2B] text-[13px] text-[#0D1829] focus:outline-none focus:ring-2 focus:ring-[#C52B2B]/20 transition-all" />
                  <p className="mt-1 text-[11px] text-[#C52B2B]">Enter a valid sort code (e.g. 40-12-34)</p>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#3A4A62] mb-1.5">Disabled</label>
                  <input type="text" value="GB29NWBK60161331926819" readOnly className="w-full h-10 px-3.5 rounded-[6px] bg-[#E8EBF0] border border-transparent text-[13px] text-[#9AABC4] cursor-not-allowed" style={{ fontFamily: "'DM Mono', monospace" }} />
                </div>
              </div>
            </div>

            {/* Other controls */}
            <div className="p-6 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] space-y-6">
              <div>
                <SubTitle label="Select" />
                <label className="block text-[12px] font-semibold text-[#3A4A62] mb-1.5">Account Type</label>
                <div className="relative">
                  <select className="w-full h-10 px-3.5 pr-9 rounded-[6px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] appearance-none focus:outline-none focus:border-[#1764C0] focus:ring-2 focus:ring-[#1764C0]/15 transition-all cursor-pointer">
                    <option>Current Account</option>
                    <option>Savings Account</option>
                    <option>Business Account</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8CAA] pointer-events-none" />
                </div>
              </div>
              <div>
                <SubTitle label="Textarea" />
                <label className="block text-[12px] font-semibold text-[#3A4A62] mb-1.5">Payment Reference</label>
                <textarea rows={3} placeholder="Add a reference for this payment..." className="w-full px-3.5 py-2.5 rounded-[6px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all resize-none" />
              </div>
              <div>
                <SubTitle label="Checkbox & Radio" />
                <div className="space-y-3">
                  {[
                    { label: "Enable two-factor authentication", checked: checked1, toggle: () => setChecked1(!checked1) },
                    { label: "Receive email notifications",      checked: checked2, toggle: () => setChecked2(!checked2) },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-4 h-4 rounded-[3px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          item.checked ? "bg-[#0B3270] border-[#0B3270]" : "border-[#B8C5DD] group-hover:border-[#0B3270]"
                        }`}
                        onClick={item.toggle}
                      >
                        {item.checked && <Check size={9} className="text-white" strokeWidth={3.5} />}
                      </div>
                      <span className="text-[13px] text-[#3A4A62]">{item.label}</span>
                    </label>
                  ))}
                  {["Standard transfer (free)", "Priority transfer ($0.50)"].map((label, i) => (
                    <label key={label} className="flex items-center gap-3 cursor-pointer group" onClick={() => setRadioVal(i === 0 ? "standard" : "priority")}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        radioVal === (i === 0 ? "standard" : "priority") ? "border-[#0B3270]" : "border-[#B8C5DD] group-hover:border-[#0B3270]"
                      }`}>
                        {radioVal === (i === 0 ? "standard" : "priority") && <div className="w-2 h-2 rounded-full bg-[#0B3270]" />}
                      </div>
                      <span className="text-[13px] text-[#3A4A62]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <SubTitle label="Toggle Switch" />
                <div className="flex items-center gap-3">
                  <button
                    role="switch"
                    aria-checked={switchOn}
                    onClick={() => setSwitchOn(!switchOn)}
                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1764C0] focus:ring-offset-2 ${switchOn ? "bg-[#0B3270]" : "bg-[#B8C5DD]"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${switchOn ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-[13px] text-[#3A4A62]">{switchOn ? "Notifications on" : "Notifications off"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <SubTitle label="Search" />
          <div className="flex gap-3 mb-10">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BBE]" />
              <input type="text" placeholder="Search transactions, payees..." className="w-full h-10 pl-9 pr-4 rounded-[6px] bg-white border border-[rgba(11,50,112,0.12)] text-[13px] text-[#0D1829] placeholder-[#8A9BBE] focus:outline-none focus:border-[#1764C0] focus:ring-2 focus:ring-[#1764C0]/15 transition-all shadow-[0_1px_3px_rgba(11,50,112,0.06)]" />
            </div>
            <Btn variant="outline" icon={<Filter size={13} />}>Filter</Btn>
          </div>
        </section>

        {/* ── CARDS ── */}
        <section id="cards">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 03</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Cards</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
            {/* Balance card */}
            <div className="p-5 bg-white rounded-[12px] border border-[rgba(11,50,112,0.07)] shadow-[0_2px_8px_rgba(11,50,112,0.06)] hover:shadow-[0_4px_16px_rgba(11,50,112,0.09)] transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Current Account</div>
                <CreditCard size={14} className="text-[#8A9BBE]" />
              </div>
              <div className="text-[28px] font-bold text-[#0D1829] leading-none mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>$38,240</div>
              <div className="text-[12px] text-[#8A9BBE] mb-4">.00 available balance</div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-[#0E7C4D]" />
                <span className="text-[11px] font-semibold text-[#0E7C4D]">+12.4%</span>
                <span className="text-[11px] text-[#8A9BBE]">vs last month</span>
              </div>
            </div>

            {/* Dark accent card */}
            <div className="p-5 bg-[#0B3270] rounded-[12px] shadow-[0_4px_20px_rgba(11,50,112,0.30)]">
              <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[rgba(255,255,255,0.45)] mb-4">Monthly Budget</div>
              <div className="text-[28px] font-bold text-white leading-none mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>$5,200</div>
              <div className="text-[12px] text-[rgba(255,255,255,0.45)] mb-5">of $7,000 spent</div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.12)] rounded-full">
                <div className="h-1.5 bg-white rounded-full" style={{ width: "74%" }} />
              </div>
              <div className="text-[11px] text-[rgba(255,255,255,0.4)] mt-2">74% · $1,800 remaining</div>
            </div>

            {/* Goal card */}
            <div className="p-5 bg-white rounded-[12px] border border-[rgba(11,50,112,0.07)] shadow-[0_2px_8px_rgba(11,50,112,0.06)] hover:shadow-[0_4px_16px_rgba(11,50,112,0.09)] transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Savings Pot</div>
                <Star size={14} className="text-[#B46A0A]" />
              </div>
              <div className="text-[28px] font-bold text-[#0D1829] leading-none mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>$12,500</div>
              <div className="text-[12px] text-[#8A9BBE] mb-4">Emergency fund — Goal: $15,000</div>
              <div className="h-1.5 bg-[#EBF0FA] rounded-full">
                <div className="h-1.5 bg-[#1764C0] rounded-full" style={{ width: "83%" }} />
              </div>
              <div className="text-[11px] text-[#8A9BBE] mt-2">83% complete</div>
            </div>
          </div>
        </section>

        {/* ── BADGES & ALERTS ── */}
        <section id="badges">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 04</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Badges & Alerts</h2>
          </div>
          <SubTitle label="Badges" />
          <div className="flex flex-wrap gap-2.5 p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] mb-5">
            <Bdg label="Default" variant="default" />
            <Bdg label="Completed" variant="success" />
            <Bdg label="Pending" variant="pending" />
            <Bdg label="Failed" variant="error" />
            <Bdg label="Information" variant="info" />
            <Bdg label="Neutral" variant="neutral" />
            <Bdg label="Income" variant="success" />
            <Bdg label="Transfer" variant="default" />
            <Bdg label="Groceries" variant="neutral" />
            <Bdg label="Utilities" variant="warning" />
          </div>
          <SubTitle label="Alert / Inline Notification" />
          <div className="space-y-3 mb-10">
            {[
              { icon: <CheckCircle size={15} />, color: "#0E7C4D", bg: "#D6F0E6", border: "#A4D4BB", title: "Transfer successful", msg: "$500.00 has been sent to James Chen. Reference: HOLIDAY2026. Estimated arrival: instantly." },
              { icon: <AlertTriangle size={15} />, color: "#B46A0A", bg: "#FDF0D6", border: "#EAC97A", title: "Action required", msg: "Your ID verification expires in 14 days. Update your documents to maintain full account access." },
              { icon: <XCircle size={15} />, color: "#C52B2B", bg: "#FDE8E8", border: "#F0ADAD", title: "Payment declined", msg: "Insufficient funds to complete this transaction. Please top up your account and try again." },
              { icon: <Info size={15} />, color: "#1155A6", bg: "#D8E7F8", border: "#9BBFE8", title: "Scheduled maintenance", msg: "Platform maintenance is scheduled for Sunday 13 Jul between 02:00–04:00 BST. Some features may be unavailable." },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-[8px] border" style={{ backgroundColor: a.bg, borderColor: a.border }}>
                <span style={{ color: a.color }} className="flex-shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold mb-0.5" style={{ color: a.color }}>{a.title}</div>
                  <div className="text-[12px] leading-relaxed" style={{ color: a.color, opacity: 0.82 }}>{a.msg}</div>
                </div>
                <button style={{ color: a.color }} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── TABLE ── */}
        <section id="tables">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 05</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Tables</h2>
          </div>
          <div className="bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)] overflow-hidden mb-10 shadow-[0_2px_8px_rgba(11,50,112,0.05)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(11,50,112,0.06)]">
              <div className="text-[14px] font-semibold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Recent Transactions</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 h-8 px-3 rounded-[6px] bg-[#EEF2F9] text-[12px] text-[#7A8CAA] cursor-pointer">
                  <Search size={12} />
                  <span>Search…</span>
                </div>
                <Btn variant="outline" size="sm" icon={<Filter size={11} />}>Filter</Btn>
                <Btn variant="ghost" size="sm" icon={<Download size={11} />}>Export</Btn>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(11,50,112,0.06)]">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Description</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Category</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Date</th>
                    <th className="text-right px-5 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Amount</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8A9BBE]">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 6).map((tx, i, arr) => (
                    <tr key={tx.id} className={`${i < arr.length - 1 ? "border-b border-[rgba(11,50,112,0.04)]" : ""} hover:bg-[#F8FAFD] transition-colors group`}>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[#0D1829]">{tx.name}</td>
                      <td className="px-5 py-3.5">
                        <Bdg
                          label={tx.category}
                          variant={tx.category === "Income" ? "success" : tx.category === "Transfer" ? "info" : "neutral"}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-[#7A8CAA]">{tx.date}</td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-medium" style={{ fontFamily: "'DM Mono', monospace", color: tx.amount > 0 ? "#0E7C4D" : "#0D1829" }}>
                        {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2">
                          <StatusDot status={tx.status} />
                          <span className="text-[12px] capitalize text-[#5E6E8E]">{tx.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#7A8CAA] hover:text-[#0B3270]">
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[rgba(11,50,112,0.06)]">
              <div className="text-[12px] text-[#8A9BBE]">Showing 6 of 234 transactions</div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded-[4px] text-[#8A9BBE] hover:bg-[#EEF2F9] hover:text-[#0B3270] transition-colors">
                  <ChevronLeft size={13} />
                </button>
                {[1, 2, 3].map((p) => (
                  <button key={p} className={`w-7 h-7 flex items-center justify-center rounded-[4px] text-[12px] font-medium transition-colors ${p === 1 ? "bg-[#0B3270] text-white" : "text-[#5E6E8E] hover:bg-[#EEF2F9]"}`}>{p}</button>
                ))}
                <span className="px-1 text-[12px] text-[#8A9BBE]">…</span>
                <button className="w-7 h-7 flex items-center justify-center rounded-[4px] text-[12px] text-[#5E6E8E] hover:bg-[#EEF2F9] transition-colors">39</button>
                <button className="w-7 h-7 flex items-center justify-center rounded-[4px] text-[#8A9BBE] hover:bg-[#EEF2F9] hover:text-[#0B3270] transition-colors">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── DATA DISPLAY ── */}
        <section id="datadisplay">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 06</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Data Display</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-10">
            <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <SubTitle label="Progress Bars" />
              <div className="space-y-4">
                {[
                  { label: "KYC Verification",  value: 100, color: "#0E7C4D" },
                  { label: "Profile Completion", value: 75,  color: "#1764C0" },
                  { label: "Holiday Fund",       value: 48,  color: "#0B3270" },
                  { label: "Savings Goal",       value: 20,  color: "#B46A0A" },
                ].map((p) => (
                  <div key={p.label}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="font-medium text-[#3A4A62]">{p.label}</span>
                      <span className="text-[#7A8CAA]" style={{ fontFamily: "'DM Mono', monospace" }}>{p.value}%</span>
                    </div>
                    <div className="h-1.5 bg-[#E4EAF5] rounded-full">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.value}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <SubTitle label="Skeleton Loader" />
              <div className="space-y-3">
                <div className="h-5 bg-[#E4EAF5] rounded-[4px] w-2/3 animate-pulse" />
                <div className="h-3.5 bg-[#E4EAF5] rounded-[4px] animate-pulse" />
                <div className="h-3.5 bg-[#E4EAF5] rounded-[4px] w-4/5 animate-pulse" />
                <div className="h-3.5 bg-[#E4EAF5] rounded-[4px] w-3/5 animate-pulse" />
                <div className="flex gap-3 pt-2">
                  <div className="w-10 h-10 bg-[#E4EAF5] rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-[#E4EAF5] rounded-[4px] w-1/2 animate-pulse" />
                    <div className="h-2.5 bg-[#E4EAF5] rounded-[4px] animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-[#E4EAF5] rounded-[8px] animate-pulse" />
              </div>
            </div>
            <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <SubTitle label="Avatars" />
              <div className="flex flex-wrap items-end gap-5">
                {[
                  { initials: "JC", size: 48, bg: "#0B3270" },
                  { initials: "SA", size: 36, bg: "#1764C0" },
                  { initials: "RK", size: 28, bg: "#0E7C4D" },
                  { initials: "PW", size: 22, bg: "#B46A0A" },
                ].map((a) => (
                  <div key={a.initials} className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-semibold" style={{ width: a.size, height: a.size, backgroundColor: a.bg, fontSize: Math.round(a.size * 0.36) }}>
                    {a.initials}
                  </div>
                ))}
                <div className="flex -space-x-2">
                  {["#0B3270", "#1764C0", "#0E7C4D"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: c }}>
                      {["JC","SA","RK"][i]}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#E4EAF5] flex items-center justify-center text-[10px] font-semibold text-[#5E6E8E]">+5</div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <SubTitle label="Loaders & States" />
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="text-[#1764C0] animate-spin" />
                  <span className="text-[10px] text-[#8A9BBE]">Spinning</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={18} className="text-[#0B3270] animate-spin" />
                  <span className="text-[10px] text-[#8A9BBE]">SM</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#1764C0] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8A9BBE]">Dots</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF2F9] rounded-full">
                    <Loader2 size={12} className="text-[#1764C0] animate-spin" />
                    <span className="text-[12px] text-[#3A4A62]">Processing…</span>
                  </div>
                  <span className="text-[10px] text-[#8A9BBE]">Inline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-[#E4EAF5] border-t-[#1764C0] animate-spin" />
                  <span className="text-[10px] text-[#8A9BBE]">Ring</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CHARTS ── */}
        <section id="charts">
          <div className="pt-8 pb-5 border-b border-[rgba(11,50,112,0.08)] mb-7">
            <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Component 07</div>
            <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Charts</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-16">
            <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <div className="text-[13px] font-semibold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Balance Trend</div>
              <div className="text-[11px] text-[#8A9BBE] mb-4">Jan–Jul 2026 — Area chart</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={balanceTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1764C0" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1764C0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,50,112,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A9BBE" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8A9BBE" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, border: "1px solid rgba(11,50,112,0.10)", fontSize: 12, boxShadow: "0 4px 12px rgba(11,50,112,0.08)" }}
                    formatter={(v: number) => [`${v.toLocaleString()}`, "Balance"]}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#1764C0" strokeWidth={2} fill="url(#balGrad)" dot={false} activeDot={{ r: 4, fill: "#1764C0" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="p-5 bg-white rounded-[10px] border border-[rgba(11,50,112,0.07)]">
              <div className="text-[13px] font-semibold text-[#0D1829] mb-0.5" style={{ fontFamily: "Figtree, sans-serif" }}>Income vs Expenses</div>
              <div className="text-[11px] text-[#8A9BBE] mb-4">Jan–Jul 2026 — Bar chart</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={spendingData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,50,112,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A9BBE" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8A9BBE" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={32} />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, border: "1px solid rgba(11,50,112,0.10)", fontSize: 12 }}
                    formatter={(v: number) => [`${v.toLocaleString()}`]}
                  />
                  <Bar dataKey="income" fill="#D8E7F8" radius={[3, 3, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#0B3270" radius={[3, 3, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[2px] bg-[#D8E7F8]" /><span className="text-[11px] text-[#8A9BBE]">Income</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[2px] bg-[#0B3270]" /><span className="text-[11px] text-[#8A9BBE]">Expenses</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── SECTION: PUBLIC WEBSITE ──────────────────────────────────────────────────

function PublicWebsiteView() {
  const features = [
    { icon: <Shield size={18} />, title: "Bank-Grade Security", desc: "256-bit TLS encryption, biometric authentication, and real-time fraud monitoring on every account." },
    { icon: <Zap size={18} />, title: "Instant Transfers", desc: "Send money anywhere in the UK 24/7 via Faster Payments — free, immediate, and reliable." },
    { icon: <Activity size={18} />, title: "Financial Intelligence", desc: "AI-powered spending analysis, categorisation, and personalised insights to help you reach your goals." },
    { icon: <Globe size={18} />, title: "Worldwide Access", desc: "Spend in 180+ countries at real exchange rates. No hidden fees. No surprises on your statement." },
    { icon: <Wallet size={18} />, title: "Smart Savings", desc: "Round-up pots, automated transfers, and competitive AER rates to grow your money effortlessly." },
    { icon: <FileText size={18} />, title: "Clear Statements", desc: "Downloadable statements, categorised history, and annual tax summaries always available." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Site header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[rgba(11,50,112,0.08)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <MevrelLogo />
          <nav className="hidden md:flex items-center gap-8">
            {["Personal", "Business", "About", "Careers", "Support"].map((n) => (
              <a key={n} href="#" className="text-[13px] text-[#5E6E8E] hover:text-[#0B3270] font-medium transition-colors">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Btn variant="ghost" size="sm">Log in</Btn>
            <Btn variant="primary" size="sm">Open Account</Btn>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0B3270] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-32 -top-32 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(74,162,216,0.12) 0%, transparent 70%)" }} />
          <div className="absolute -left-24 bottom-0 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(17,85,166,0.15) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-28 relative">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(74,162,216,0.3)] bg-[rgba(74,162,216,0.08)] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4AA2D8]" />
              <span className="text-[11px] font-semibold text-[#4AA2D8] tracking-[0.08em]">FDIC Insured · Protected up to $250,000</span>
            </div>
            <h1 className="text-[54px] font-extrabold text-white leading-[1.03] mb-7 tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
              Banking built for the way you live.
            </h1>
            <p className="text-[18px] text-[rgba(255,255,255,0.60)] leading-relaxed mb-10 max-w-[520px]">
              MevrelBank brings clarity, speed, and intelligence to your finances — from your first deposit to your future goals.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Btn variant="secondary" size="lg">Open a Free Account</Btn>
              <button className="flex items-center gap-2 text-[14px] font-semibold text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">
                See how it works <ArrowRight size={14} />
              </button>
            </div>
            <div className="mt-12 flex items-stretch gap-8 flex-wrap">
              {[
                { val: "2.4M+", label: "Active customers" },
                { val: "$18B+", label: "Assets managed" },
                { val: "99.99%", label: "Platform uptime" },
                { val: "4.9★", label: "App Store rating" },
              ].map((s) => (
                <div key={s.label} className="border-l border-[rgba(255,255,255,0.12)] pl-8 first:border-0 first:pl-0">
                  <div className="text-[24px] font-bold text-white leading-none mb-1" style={{ fontFamily: "Figtree, sans-serif" }}>{s.val}</div>
                  <div className="text-[12px] text-[rgba(255,255,255,0.45)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-5 bg-[#F4F7FB] border-b border-[rgba(11,50,112,0.07)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              { icon: <Shield size={14} />, label: "FSCS Protected" },
              { icon: <Lock size={14} />, label: "FCA Regulated" },
              { icon: <CheckCircle size={14} />, label: "ISO 27001 Certified" },
              { icon: <Star size={14} />, label: "Which? Recommended 2026" },
              { icon: <Users size={14} />, label: "2.4M+ Customers" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-[#5E6E8E]">
                <span className="text-[#0B3270]">{t.icon}</span>
                <span className="text-[12px] font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">Why MevrelBank</div>
            <h2 className="text-[38px] font-bold text-[#0D1829] leading-tight mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>
              Everything you need.<br />Nothing you don't.
            </h2>
            <p className="text-[16px] text-[#5E6E8E] max-w-[480px] mx-auto leading-relaxed">
              Thoughtfully engineered features that make managing money effortless.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-[10px] border border-[rgba(11,50,112,0.08)] hover:border-[rgba(23,100,192,0.30)] hover:shadow-[0_4px_20px_rgba(11,50,112,0.07)] transition-all group">
                <div className="w-10 h-10 rounded-[8px] bg-[#EBF0FA] flex items-center justify-center text-[#1764C0] mb-5 group-hover:bg-[#0B3270] group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-[#0D1829] mb-2" style={{ fontFamily: "Figtree, sans-serif" }}>{f.title}</h3>
                <p className="text-[13px] text-[#5E6E8E] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 bg-[#F4F7FB] border-t border-[rgba(11,50,112,0.07)]">
        <div className="max-w-[560px] mx-auto px-6 text-center">
          <h2 className="text-[36px] font-bold text-[#0D1829] mb-4 leading-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
            Ready to bank differently?
          </h2>
          <p className="text-[16px] text-[#5E6E8E] mb-8 leading-relaxed">
            Join 2.4 million people who manage their money with MevrelBank. Open your account in minutes — no branches, no paperwork.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Btn variant="primary" size="lg">Open a Free Account</Btn>
            <Btn variant="outline" size="lg">Compare Plans</Btn>
          </div>
          <p className="mt-5 text-[12px] text-[#8A9BBE]">No credit check · FCA regulated · FSCS protected · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D1829] py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap gap-10 justify-between mb-10">
            <div className="max-w-[280px]">
              <MevrelLogo inverted className="mb-5" />
              <p className="text-[12px] text-[rgba(255,255,255,0.35)] leading-relaxed">
                MevrelBank is a financial technology company, not a bank. Banking services provided by partner institutions. Deposits protected by FDIC up to $250,000.
              </p>
            </div>
            <div className="flex flex-wrap gap-10">
              {[
                { title: "Products",  links: ["Personal Account", "Savings", "Business", "International"] },
                { title: "Company",   links: ["About Us", "Careers", "Press", "Blog"] },
                { title: "Legal",     links: ["Privacy Policy", "Cookie Policy", "Terms", "Accessibility"] },
                { title: "Support",   links: ["Help Centre", "Contact Us", "Security", "Status"] },
              ].map((col) => (
                <div key={col.title}>
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[rgba(255,255,255,0.28)] mb-3">{col.title}</div>
                  <div className="space-y-2.5">
                    {col.links.map((l) => (
                      <a key={l} href="#" className="block text-[12px] text-[rgba(255,255,255,0.48)] hover:text-[rgba(255,255,255,0.80)] transition-colors">{l}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[rgba(255,255,255,0.07)] pt-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="text-[11px] text-[rgba(255,255,255,0.25)]">© 2026 MevrelBank Ltd. All rights reserved. Registered in England & Wales, No. 12345678.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── SECTION: INTERNET BANKING ────────────────────────────────────────────────

// The banking portal shell/content now live in website/components/DashboardShell.tsx
// and DashboardOverview.tsx so they can be reused by both this design-system
// preview tab and the real, routed /dashboard/* pages. Import them directly
// rather than redefining the UI here.

// ─── SECTION: AUTH FLOWS ─────────────────────────────────────────────────────

function AuthView() {
  const [mode, setMode] = useState<"login" | "otp" | "register">("login");
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Login / OTP panel */}
      <div className="bg-white rounded-[12px] border border-[rgba(11,50,112,0.08)] shadow-[0_4px_20px_rgba(11,50,112,0.07)] overflow-hidden">
        {/* Compact brand strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#091E42] via-[#1155A6] to-[#4AA2D8]" />
        <div className="p-8">
          <div className="mb-1.5">
            <MevrelLogo size="sm" />
          </div>
          <div className="flex gap-1 mb-8 mt-5">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-[6px] text-[12px] font-semibold transition-all ${mode === m || (mode === "otp" && m === "login") ? "bg-[#0B3270] text-white" : "text-[#5E6E8E] hover:bg-[#EEF2F9]"}`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {mode === "login" && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#3A4A62] mb-1.5 tracking-[0.04em]">EMAIL ADDRESS</label>
                <input type="email" defaultValue="james.chen@email.com" className="w-full h-11 px-4 rounded-[7px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-[#3A4A62] tracking-[0.04em]">PASSWORD</label>
                  <a href="#" className="text-[11px] text-[#1764C0] hover:text-[#0B3270] transition-colors font-medium">Forgot?</a>
                </div>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="Enter your password" className="w-full h-11 px-4 pr-11 rounded-[7px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A8CAA] hover:text-[#0B3270] transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <Btn variant="primary" size="lg" className="w-full justify-center" onClick={() => setMode("otp")}>
                Continue
              </Btn>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-[rgba(11,50,112,0.08)]" />
                <span className="text-[11px] text-[#8A9BBE]">or</span>
                <div className="flex-1 h-px bg-[rgba(11,50,112,0.08)]" />
              </div>
              <Btn variant="outline" size="lg" className="w-full justify-center" icon={<Lock size={13} />}>
                Biometric / Passkey
              </Btn>
            </div>
          )}

          {mode === "otp" && (
            <div>
              <button onClick={() => setMode("login")} className="flex items-center gap-1.5 text-[12px] text-[#7A8CAA] hover:text-[#0B3270] mb-6 transition-colors">
                <ChevronLeft size={13} /> Back to login
              </button>
              <div className="w-11 h-11 rounded-full bg-[#EBF0FA] flex items-center justify-center mb-4">
                <Shield size={20} className="text-[#1764C0]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#0D1829] mb-1" style={{ fontFamily: "Figtree, sans-serif" }}>Two-Step Verification</h3>
              <p className="text-[13px] text-[#7A8CAA] mb-6">Code sent to <span className="text-[#0D1829] font-medium">+44 *** *** 4872</span></p>
              <div className="flex gap-2 mb-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input key={i} type="text" maxLength={1} className="flex-1 h-12 text-center text-[20px] font-bold text-[#0D1829] bg-[#EEF2F9] border-2 border-transparent rounded-[7px] focus:outline-none focus:border-[#1764C0] focus:bg-white transition-all" style={{ fontFamily: "'DM Mono', monospace" }} defaultValue={["4","8","2","","",""][i]} />
                ))}
              </div>
              <Btn variant="primary" size="lg" className="w-full justify-center">Verify &amp; Sign In</Btn>
              <p className="text-center text-[12px] text-[#7A8CAA] mt-4">
                Didn't receive it? <button className="text-[#1764C0] font-semibold hover:text-[#0B3270] transition-colors">Resend in 0:42</button>
              </p>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#3A4A62] mb-1.5 tracking-[0.04em]">FIRST NAME</label>
                  <input type="text" placeholder="James" className="w-full h-11 px-4 rounded-[7px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#3A4A62] mb-1.5 tracking-[0.04em]">LAST NAME</label>
                  <input type="text" placeholder="Chen" className="w-full h-11 px-4 rounded-[7px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#3A4A62] mb-1.5 tracking-[0.04em]">EMAIL ADDRESS</label>
                <input type="email" placeholder="james.chen@email.com" className="w-full h-11 px-4 rounded-[7px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#3A4A62] mb-1.5 tracking-[0.04em]">DATE OF BIRTH</label>
                <input type="text" placeholder="DD / MM / YYYY" className="w-full h-11 px-4 rounded-[7px] bg-[#EEF2F9] border border-transparent text-[13px] text-[#0D1829] placeholder-[#9AABC4] focus:outline-none focus:border-[#1764C0] focus:bg-white focus:ring-2 focus:ring-[#1764C0]/15 transition-all" style={{ fontFamily: "'DM Mono', monospace" }} />
              </div>
              <Btn variant="primary" size="lg" className="w-full justify-center">Create Account</Btn>
              <p className="text-center text-[11px] text-[#8A9BBE] leading-relaxed">
                By continuing, you agree to our <a href="#" className="text-[#1764C0]">Terms of Service</a> and <a href="#" className="text-[#1764C0]">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KYC panel */}
      <div className="bg-white rounded-[12px] border border-[rgba(11,50,112,0.08)] shadow-[0_4px_20px_rgba(11,50,112,0.07)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#0E7C4D] to-[#4AA2D8]" />
        <div className="p-8">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#4AA2D8] mb-2">Identity Verification</div>
          <h3 className="text-[20px] font-bold text-[#0D1829] mb-1" style={{ fontFamily: "Figtree, sans-serif" }}>KYC Verification</h3>
          <p className="text-[12px] text-[#7A8CAA] mb-6">Complete identity verification to unlock all features.</p>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {[
              { label: "Personal Information",   status: "done",    note: "Verified 3 Jul 2026" },
              { label: "Identity Document",       status: "done",    note: "Passport · Verified" },
              { label: "Proof of Address",        status: "active",  note: "Upload document" },
              { label: "Selfie Verification",     status: "pending", note: "Pending" },
              { label: "Review & Approval",       status: "pending", note: "Est. 24–48 hours" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-colors ${
                  step.status === "done"    ? "bg-[#0E7C4D] text-white" :
                  step.status === "active"  ? "bg-[#1764C0] text-white" :
                  "bg-[#E4EAF5] text-[#8A9BBE]"
                }`}>
                  {step.status === "done" ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <div className="flex-1">
                  <div className={`text-[13px] font-medium ${step.status === "pending" ? "text-[#8A9BBE]" : "text-[#0D1829]"}`}>{step.label}</div>
                  <div className="text-[11px] text-[#8A9BBE]">{step.note}</div>
                </div>
                {step.status === "active" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1764C0] animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed border-[rgba(23,100,192,0.25)] rounded-[10px] p-6 text-center hover:border-[#1764C0] hover:bg-[#F8FAFF] transition-all cursor-pointer mb-4">
            <div className="w-10 h-10 rounded-full bg-[#EBF0FA] flex items-center justify-center mx-auto mb-3">
              <Plus size={18} className="text-[#1764C0]" />
            </div>
            <div className="text-[13px] font-semibold text-[#0D1829] mb-1">Upload Proof of Address</div>
            <div className="text-[11px] text-[#8A9BBE]">Bank statement, utility bill, or council tax letter (PDF, JPG — max 10MB)</div>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="font-medium text-[#3A4A62]">Verification Progress</span>
            <span className="text-[#8A9BBE]" style={{ fontFamily: "'DM Mono', monospace" }}>60%</span>
          </div>
          <div className="h-1.5 bg-[#EBF0FA] rounded-full">
            <div className="h-1.5 bg-[#1764C0] rounded-full" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

type TabId = "system" | "website" | "banking" | "auth";

const tabs: { id: TabId; label: string; sub: string }[] = [
  { id: "system",  label: "Design System",     sub: "Foundations & Components" },
  { id: "website", label: "Public Website",    sub: "Marketing & Acquisition" },
  { id: "banking", label: "Internet Banking",  sub: "Customer Dashboard" },
  { id: "auth",    label: "Auth & KYC",        sub: "Login, Register, Identity" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("system");

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Global Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[rgba(11,50,112,0.08)] shadow-[0_1px_0_rgba(11,50,112,0.05)]">
        <div className="flex items-center gap-0 px-4 h-[57px]">
          <div className="mr-5 flex-shrink-0">
            <MevrelLogo size="sm" />
          </div>
          <div className="h-4 w-px bg-[rgba(11,50,112,0.12)] mr-5" />
          <nav className="flex items-center gap-0.5 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-[6px] text-[12px] font-semibold transition-all flex flex-col items-start gap-0 ${
                  activeTab === tab.id
                    ? "bg-[#EBF0FA] text-[#0B3270]"
                    : "text-[#7A8CAA] hover:text-[#3A4A62] hover:bg-[#F4F7FB]"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] font-normal leading-none ${activeTab === tab.id ? "text-[#7A8CAA]" : "text-[#B0BDD5]"}`}>{tab.sub}</span>
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF0FA]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0E7C4D]" />
              <span className="text-[10px] font-semibold text-[#0B3270] tracking-[0.06em]">v1.0.0 · Design System</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === "system" && <DesignSystemView />}

      {activeTab === "website" && <PublicWebsiteView />}

      {activeTab === "banking" && (
        <div className="p-5">
          <div className="max-w-[1100px] mx-auto">
            <DashboardShell>
              <DashboardOverview />
            </DashboardShell>
          </div>
        </div>
      )}

      {activeTab === "auth" && (
        <div className="p-8 min-h-[calc(100vh-57px)] flex items-start justify-center">
          <div className="w-full max-w-[900px]">
            <div className="mb-7">
              <div className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#4AA2D8] mb-2">Product Screens</div>
              <h2 className="text-[26px] font-bold text-[#0D1829]" style={{ fontFamily: "Figtree, sans-serif" }}>Authentication & KYC</h2>
              <p className="text-[13px] text-[#5E6E8E] mt-1">Login, two-step verification, registration, and identity verification flows.</p>
            </div>
            <AuthView />
          </div>
        </div>
      )}
    </div>
  );
}
