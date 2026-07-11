// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// Shared demo-only figures for the customer banking pages. Replace with real
// API data once the Phase 2 backend (auth) and Phase 3 banking APIs land.

export const balanceTrend = [
  { month: "Jan", balance: 24800 },
  { month: "Feb", balance: 28500 },
  { month: "Mar", balance: 26200 },
  { month: "Apr", balance: 29400 },
  { month: "May", balance: 32100 },
  { month: "Jun", balance: 35600 },
  { month: "Jul", balance: 38240 },
];

export interface MockTransaction {
  id: number;
  name: string;
  category: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  account: "Current Account" | "Savings Account";
}

export const transactions: MockTransaction[] = [
  { id: 1, name: "Waitrose Supermarket", category: "Groceries", date: "Today, 14:32", amount: -86.40, status: "completed", account: "Current Account" },
  { id: 2, name: "Salary – Apex Solutions Ltd", category: "Income", date: "Today, 09:00", amount: 8400.00, status: "completed", account: "Current Account" },
  { id: 3, name: "Netflix UK", category: "Entertainment", date: "Yesterday", amount: -15.99, status: "completed", account: "Current Account" },
  { id: 4, name: "Transfer to J. Chen", category: "Transfer", date: "Yesterday", amount: -500.00, status: "completed", account: "Current Account" },
  { id: 5, name: "TfL Contactless", category: "Transport", date: "Mon 7 Jul", amount: -4.80, status: "completed", account: "Current Account" },
  { id: 6, name: "Amazon.co.uk", category: "Shopping", date: "Mon 7 Jul", amount: -34.99, status: "pending", account: "Current Account" },
  { id: 7, name: "EDF Energy Direct Debit", category: "Utilities", date: "Sat 5 Jul", amount: -89.00, status: "completed", account: "Current Account" },
  { id: 8, name: "Nando's Westfield", category: "Dining", date: "Fri 4 Jul", amount: -28.50, status: "completed", account: "Current Account" },
  { id: 9, name: "Interest Payment", category: "Interest", date: "Mon 1 Jul", amount: 18.42, status: "completed", account: "Savings Account" },
  { id: 10, name: "Transfer from Current Account", category: "Transfer", date: "Fri 27 Jun", amount: 500.00, status: "completed", account: "Savings Account" },
];

export interface MockAccount {
  id: string;
  name: string;
  type: "Current Account" | "Savings Account";
  sortCode: string;
  accountNumber: string;
  balance: number;
  available: number;
}

export const accounts: MockAccount[] = [
  { id: "acc-current", name: "Current Account", type: "Current Account", sortCode: "40-47-84", accountNumber: "•••• 3821", balance: 38240.00, available: 38240.00 },
  { id: "acc-savings", name: "Instant Access Savings", type: "Savings Account", sortCode: "40-47-84", accountNumber: "•••• 9014", balance: 12500.00, available: 12500.00 },
];

export interface MockStatement {
  id: string;
  period: string;
  account: string;
  generated: string;
}

export const statements: MockStatement[] = [
  { id: "stmt-2026-06", period: "June 2026", account: "Current Account", generated: "1 Jul 2026" },
  { id: "stmt-2026-05", period: "May 2026", account: "Current Account", generated: "1 Jun 2026" },
  { id: "stmt-2026-04", period: "April 2026", account: "Current Account", generated: "1 May 2026" },
  { id: "stmt-2026-q2-sav", period: "Q2 2026", account: "Savings Account", generated: "1 Jul 2026" },
  { id: "stmt-2026-q1-sav", period: "Q1 2026", account: "Savings Account", generated: "1 Apr 2026" },
];

export interface MockBeneficiary {
  id: string;
  name: string;
  nickname?: string;
  sortCode: string;
  accountNumber: string;
  lastPaid?: string;
}

export const beneficiaries: MockBeneficiary[] = [
  { id: "ben-1", name: "J. Chen", nickname: "Jordan", sortCode: "20-11-33", accountNumber: "•••• 4471", lastPaid: "Yesterday" },
  { id: "ben-2", name: "Apex Property Management", sortCode: "60-02-19", accountNumber: "•••• 8830", lastPaid: "3 Jul 2026" },
  { id: "ben-3", name: "EDF Energy", sortCode: "30-90-14", accountNumber: "•••• 1102", lastPaid: "Sat 5 Jul" },
  { id: "ben-4", name: "M. Okafor", nickname: "Mum", sortCode: "04-29-77", accountNumber: "•••• 5563" },
];

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  kind: "security" | "payment" | "info";
}

export const notifications: MockNotification[] = [
  { id: "n-1", title: "New sign-in detected", body: "A sign-in from a new device was verified with MFA just now.", time: "2 min ago", read: false, kind: "security" },
  { id: "n-2", title: "Payment sent", body: "£500.00 sent to J. Chen was completed successfully.", time: "Yesterday", read: false, kind: "payment" },
  { id: "n-3", title: "Direct debit due soon", body: "EDF Energy will collect £89.00 on 5 Aug 2026.", time: "2 days ago", read: true, kind: "info" },
  { id: "n-4", title: "Statement ready", body: "Your June 2026 Current Account statement is ready to download.", time: "1 Jul 2026", read: true, kind: "info" },
];
