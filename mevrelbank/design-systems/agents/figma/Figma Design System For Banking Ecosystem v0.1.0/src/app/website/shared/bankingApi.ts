// ─── Banking data client ────────────────────────────────────────────────────
// Talks to the Phase 3 banking endpoints (/api/banking/*) using the same
// authedFetch helper the auth flow uses. Replaces mockBankingData.ts.

export interface Account {
  id: string;
  name: string;
  type: "Current Account" | "Savings Account";
  sortCode: string;
  accountNumber: string;
  balance: number;
  available: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  account: string;
  name: string;
  category: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  date: string;
}

export interface Statement {
  id: string;
  accountId: string;
  account: string;
  period: string;
  generated: string;
  fileUrl: string | null;
}

export interface Beneficiary {
  id: string;
  name: string;
  nickname?: string | null;
  sortCode: string;
  accountNumber: string;
  lastPaid?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: "security" | "payment" | "info";
  read: boolean;
  time: string;
}

type AuthedFetch = (path: string, options?: RequestInit) => Promise<Response>;

async function json<T>(authedFetch: AuthedFetch, path: string, options?: RequestInit): Promise<T> {
  const res = await authedFetch(path, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error ?? `HTTP ${res.status}`);
  return body as T;
}

export const bankingApi = {
  getAccounts: (authedFetch: AuthedFetch) =>
    json<{ accounts: Account[] }>(authedFetch, "/banking/accounts"),

  getTransactions: (authedFetch: AuthedFetch, opts?: { accountId?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.accountId) params.set("accountId", opts.accountId);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return json<{ transactions: Transaction[] }>(authedFetch, `/banking/transactions${qs ? `?${qs}` : ""}`);
  },

  getStatements: (authedFetch: AuthedFetch) =>
    json<{ statements: Statement[] }>(authedFetch, "/banking/statements"),

  getBeneficiaries: (authedFetch: AuthedFetch) =>
    json<{ beneficiaries: Beneficiary[] }>(authedFetch, "/banking/beneficiaries"),

  addBeneficiary: (authedFetch: AuthedFetch, data: { name: string; nickname?: string; sortCode: string; accountNumber: string }) =>
    json<{ beneficiary: Beneficiary }>(authedFetch, "/banking/beneficiaries", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  removeBeneficiary: (authedFetch: AuthedFetch, id: string) =>
    json<{ message: string }>(authedFetch, `/banking/beneficiaries/${id}`, { method: "DELETE" }),

  getNotifications: (authedFetch: AuthedFetch) =>
    json<{ notifications: Notification[] }>(authedFetch, "/banking/notifications"),

  markNotificationRead: (authedFetch: AuthedFetch, id: string) =>
    json<{ notification: Notification }>(authedFetch, `/banking/notifications/${id}/read`, { method: "PATCH" }),

  transfer: (authedFetch: AuthedFetch, data: { fromAccountId: string; toAccountId: string; amount: number; note?: string }) =>
    json<{ accounts: Account[] }>(authedFetch, "/banking/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  pay: (authedFetch: AuthedFetch, data: { accountId: string; beneficiaryId: string; amount: number; reference?: string }) =>
    json<{ account: Account }>(authedFetch, "/banking/pay", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Downloads a statement PDF as a blob (the file route requires the bearer token, so it can't be a plain <a href>). */
  async downloadStatement(authedFetch: AuthedFetch, id: string, filename: string) {
    const res = await authedFetch(`/banking/statements/${id}/file`);
    if (!res.ok) throw new Error("Could not download statement.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

/** Formats an ISO timestamp the way the mock data did ("Today, 14:32", "Mon 7 Jul"). */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return `Today, ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** Formats an ISO timestamp as a short relative label ("2 min ago", "3 Jul 2026"). */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
