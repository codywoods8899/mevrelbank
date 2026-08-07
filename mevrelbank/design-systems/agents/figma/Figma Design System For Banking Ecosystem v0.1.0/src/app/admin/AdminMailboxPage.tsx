import { useEffect, useRef, useState } from "react";
import {
  Inbox, Send, FileText, Trash2, Archive, ChevronRight,
  RefreshCw, X, Loader2, MailOpen, Mail, AlertCircle, Paperclip,
} from "lucide-react";
import { PageMeta } from "../website/components/PageMeta";
import { useAdminAuth } from "../context/AdminAuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MailAccount { id: string; email: string; label: string }
interface MessageSummary {
  uid: number; seqno: number; from: string; to: string;
  subject: string; date: string | null; seen: boolean;
}
interface MessageDetail {
  uid: number; from: string; to: string; cc: string;
  subject: string; date: string | null;
  html: string | null; text: string | null;
  attachments: { filename: string; contentType: string; size: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  INBOX:   <Inbox size={14} />,
  Sent:    <Send size={14} />,
  Drafts:  <FileText size={14} />,
  Trash:   <Trash2 size={14} />,
  Archive: <Archive size={14} />,
  Junk:    <Trash2 size={14} />,
  Spam:    <Trash2 size={14} />,
};

function folderIcon(name: string) {
  for (const [key, icon] of Object.entries(FOLDER_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <Mail size={14} />;
}

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (now.getTime() - d.getTime() < 7 * 86400_000)
    return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function senderName(from: string) {
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from.replace(/<[^>]+>/, "").trim() || from;
}

// ─── Compose modal ────────────────────────────────────────────────────────────

function ComposeModal({
  account,
  onClose,
  onSent,
  replyTo,
}: {
  account: MailAccount;
  onClose: () => void;
  onSent: () => void;
  replyTo?: MessageDetail;
}) {
  const { authedFetch } = useAdminAuth();
  const [to, setTo] = useState(replyTo ? senderName(replyTo.from) + " <" + replyTo.from.match(/<([^>]+)>/)?.[1] + ">" : "");
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}` : "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await authedFetch(`/admin/mailboxes/${account.id}/send`, {
        method: "POST",
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onSent();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[600px] bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0B3270] text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[14px] font-semibold">New Message</p>
            <p className="text-[11px] text-white/60 mt-0.5">From: {account.email}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1">
          <div className="px-5 pt-4 space-y-3 flex-1">
            {error && (
              <div className="flex items-center gap-2 rounded-[8px] bg-[#FEF2F2] border border-[rgba(197,43,43,0.18)] px-3 py-2 text-[12px] text-[#C52B2B]">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <div className="border-b border-[rgba(11,50,112,0.08)] pb-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9AAABF] mb-1">To</label>
              <input
                type="text"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="w-full text-[13px] text-[#0D1829] outline-none placeholder:text-[#B0BDD5]"
              />
            </div>
            <div className="border-b border-[rgba(11,50,112,0.08)] pb-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9AAABF] mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject"
                required
                className="w-full text-[13px] text-[#0D1829] outline-none placeholder:text-[#B0BDD5]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9AAABF] mb-1">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message here…"
                required
                rows={8}
                className="w-full text-[13px] text-[#0D1829] outline-none resize-none placeholder:text-[#B0BDD5] leading-relaxed"
              />
            </div>
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-[rgba(11,50,112,0.06)] flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#9AAABF]">Sent using the MevrelBank email template</p>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 rounded-[10px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0a2c62] transition-colors disabled:opacity-60"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Message viewer ───────────────────────────────────────────────────────────

function MessageViewer({ detail, onClose }: { detail: MessageDetail; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[rgba(11,50,112,0.08)] flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[16px] font-bold text-[#0D1829] leading-tight flex-1">{detail.subject}</h2>
          <button onClick={onClose} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F4F7FB] transition-colors text-[#9AAABF] hover:text-[#0D1829]">
            <X size={15} />
          </button>
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="text-[12px] text-[#5E6E8E]"><span className="text-[#9AAABF]">From:</span> {detail.from}</p>
          <p className="text-[12px] text-[#5E6E8E]"><span className="text-[#9AAABF]">To:</span> {detail.to}</p>
          {detail.cc && <p className="text-[12px] text-[#5E6E8E]"><span className="text-[#9AAABF]">Cc:</span> {detail.cc}</p>}
          <p className="text-[12px] text-[#9AAABF]">{detail.date ? new Date(detail.date).toLocaleString() : ""}</p>
        </div>
        {detail.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EBF0FA] text-[11px] text-[#0B3270] font-medium">
                <Paperclip size={11} /> {a.filename || a.contentType}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {detail.html ? (
          <iframe
            srcDoc={detail.html}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            title="Email content"
          />
        ) : (
          <div className="px-6 py-5 text-[13px] text-[#0D1829] leading-relaxed whitespace-pre-wrap">
            {detail.text ?? "(empty)"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminMailboxPage() {
  const { authedFetch, authedJson } = useAdminAuth();

  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<MailAccount | null>(null);

  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState("INBOX");

  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgsError, setMsgsError] = useState("");

  const [selectedMsg, setSelectedMsg] = useState<MessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [compose, setCompose] = useState(false);
  const [replyMsg, setReplyMsg] = useState<MessageDetail | undefined>();

  const PAGE_SIZE = 25;
  const abortRef = useRef<AbortController | null>(null);

  // Load account list once
  useEffect(() => {
    authedJson("/admin/mailboxes")
      .then((d: any) => {
        setAccounts(d.accounts ?? []);
        if (d.accounts?.length) setActiveAccount(d.accounts[0]);
      })
      .catch(() => {});
  }, []);

  // Load folders when account changes
  useEffect(() => {
    if (!activeAccount) return;
    setFolders([]);
    setActiveFolder("INBOX");
    setMessages([]);
    setSelectedMsg(null);
    authedJson(`/admin/mailboxes/${activeAccount.id}/folders`)
      .then((d: any) => setFolders(d.folders ?? []))
      .catch(() => setFolders(["INBOX"]));
  }, [activeAccount?.id]);

  // Load messages when account/folder/page changes
  useEffect(() => {
    if (!activeAccount) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoadingMsgs(true);
    setMsgsError("");
    setSelectedMsg(null);

    authedFetch(
      `/admin/mailboxes/${activeAccount.id}/messages?folder=${encodeURIComponent(activeFolder)}&page=${page}`,
      { signal: ac.signal }
    )
      .then(r => r.json())
      .then((d: any) => {
        if (d.error) throw new Error(d.error);
        setMessages(d.messages ?? []);
        setTotal(d.total ?? 0);
      })
      .catch((err: any) => {
        if (err.name === "AbortError") return;
        setMsgsError(err.message ?? "Failed to load messages.");
      })
      .finally(() => setLoadingMsgs(false));
  }, [activeAccount?.id, activeFolder, page]);

  async function openMessage(msg: MessageSummary) {
    if (!activeAccount) return;
    setLoadingDetail(true);
    setDetailError("");
    setSelectedMsg(null);
    try {
      const d = await authedJson(
        `/admin/mailboxes/${activeAccount.id}/messages/${msg.uid}?folder=${encodeURIComponent(activeFolder)}`
      );
      setSelectedMsg(d.message);
      // Mark as seen locally
      setMessages(prev => prev.map(m => m.uid === msg.uid ? { ...m, seen: true } : m));
    } catch (err: any) {
      setDetailError(err.message ?? "Failed to load message.");
    } finally {
      setLoadingDetail(false);
    }
  }

  function refresh() {
    setPage(1);
    setMessages([]);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageMeta title="Mailboxes — MevrelBank Admin" description="View and manage bank email accounts." />

      {/* Compose modal */}
      {compose && activeAccount && (
        <ComposeModal
          account={activeAccount}
          replyTo={replyMsg}
          onClose={() => { setCompose(false); setReplyMsg(undefined); }}
          onSent={refresh}
        />
      )}

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0D1829] tracking-tight" style={{ fontFamily: "Figtree, sans-serif" }}>
            Mailboxes
          </h1>
          <p className="text-[14px] text-[#5E6E8E] mt-1">Manage all bank email accounts.</p>
        </div>
        {activeAccount && (
          <button
            onClick={() => { setReplyMsg(undefined); setCompose(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#0B3270] text-white text-[13px] font-semibold hover:bg-[#0a2c62] transition-colors"
          >
            <Send size={14} /> Compose
          </button>
        )}
      </div>

      {/* Three-column layout */}
      <div className="flex rounded-[16px] border border-[rgba(11,50,112,0.08)] bg-white overflow-hidden" style={{ minHeight: "70vh" }}>

        {/* ── Col 1: Account list ── */}
        <div className="w-[170px] flex-shrink-0 border-r border-[rgba(11,50,112,0.07)] bg-[#F8FAFD] flex flex-col">
          <div className="px-4 py-3 border-b border-[rgba(11,50,112,0.07)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9AAABF]">Accounts</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => { setActiveAccount(acc); setPage(1); }}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  activeAccount?.id === acc.id
                    ? "bg-[#EBF0FA] text-[#0B3270]"
                    : "text-[#5E6E8E] hover:bg-[#EBF0FA]/60 hover:text-[#0B3270]"
                }`}
              >
                <p className="text-[13px] font-semibold truncate">{acc.label}</p>
                <p className="text-[10px] text-[#9AAABF] truncate mt-0.5">{acc.email}</p>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Col 2: Folders + message list ── */}
        <div className="w-[280px] flex-shrink-0 border-r border-[rgba(11,50,112,0.07)] flex flex-col">
          {/* Folder list */}
          {folders.length > 0 && (
            <div className="border-b border-[rgba(11,50,112,0.07)] bg-[#F8FAFD]">
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9AAABF]">Folders</p>
              </div>
              <nav className="py-1">
                {folders.slice(0, 8).map(f => (
                  <button
                    key={f}
                    onClick={() => { setActiveFolder(f); setPage(1); }}
                    className={`w-full flex items-center gap-2 px-4 py-1.5 text-[12px] transition-colors ${
                      activeFolder === f
                        ? "bg-[#EBF0FA] text-[#0B3270] font-semibold"
                        : "text-[#5E6E8E] hover:bg-[#EBF0FA]/60"
                    }`}
                  >
                    <span className={activeFolder === f ? "text-[#0B3270]" : "text-[#9AAABF]"}>{folderIcon(f)}</span>
                    <span className="truncate">{f}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Message list header */}
          <div className="px-4 py-2.5 border-b border-[rgba(11,50,112,0.07)] flex items-center justify-between bg-white">
            <p className="text-[11px] font-semibold text-[#9AAABF] uppercase tracking-[0.08em]">
              {activeFolder} {total > 0 && <span className="font-normal">· {total}</span>}
            </p>
            <button
              onClick={refresh}
              disabled={loadingMsgs}
              className="text-[#9AAABF] hover:text-[#0B3270] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={13} className={loadingMsgs ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Message list body */}
          <div className="flex-1 overflow-y-auto">
            {msgsError && (
              <div className="px-4 py-3 text-[12px] text-[#C52B2B] flex gap-2 items-start">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> {msgsError}
              </div>
            )}
            {loadingMsgs && !messages.length && (
              <div className="flex items-center justify-center py-12 text-[#9AAABF]">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}
            {!loadingMsgs && !msgsError && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[#9AAABF]">
                <MailOpen size={28} className="mb-2" />
                <p className="text-[12px]">No messages</p>
              </div>
            )}
            {messages.map(msg => (
              <button
                key={msg.uid}
                onClick={() => openMessage(msg)}
                className={`w-full text-left px-4 py-3 border-b border-[rgba(11,50,112,0.05)] transition-colors hover:bg-[#F4F7FB] ${
                  selectedMsg?.uid === msg.uid ? "bg-[#EBF0FA]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-0.5">
                  <p className={`text-[12px] truncate flex-1 ${msg.seen ? "text-[#5E6E8E] font-normal" : "text-[#0D1829] font-bold"}`}>
                    {senderName(msg.from) || "(unknown)"}
                  </p>
                  <span className="text-[10px] text-[#9AAABF] flex-shrink-0 mt-0.5">{fmtDate(msg.date)}</span>
                </div>
                <p className={`text-[12px] truncate mb-0.5 ${msg.seen ? "text-[#5E6E8E]" : "text-[#0D1829] font-semibold"}`}>
                  {msg.subject}
                </p>
                {!msg.seen && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0B3270] mt-1" />
                )}
              </button>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(11,50,112,0.07)]">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="text-[11px] text-[#0B3270] disabled:text-[#9AAABF] font-medium hover:underline"
                >
                  ← Prev
                </button>
                <span className="text-[11px] text-[#9AAABF]">{page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="text-[11px] text-[#0B3270] disabled:text-[#9AAABF] font-medium hover:underline"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Col 3: Message detail ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {loadingDetail && (
            <div className="flex-1 flex items-center justify-center text-[#9AAABF]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
          {detailError && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-[#C52B2B] text-[13px]">
                <AlertCircle size={24} className="mx-auto mb-2" /> {detailError}
              </div>
            </div>
          )}
          {selectedMsg && !loadingDetail && !detailError && (
            <div className="flex flex-col h-full">
              <MessageViewer
                detail={selectedMsg}
                onClose={() => setSelectedMsg(null)}
              />
              {/* Reply button */}
              <div className="px-6 py-3 border-t border-[rgba(11,50,112,0.07)] flex-shrink-0 flex justify-end">
                <button
                  onClick={() => { setReplyMsg(selectedMsg); setCompose(true); }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-[8px] border border-[rgba(11,50,112,0.2)] text-[12px] text-[#0B3270] font-semibold hover:bg-[#EBF0FA] transition-colors"
                >
                  <ChevronRight size={13} className="rotate-180" /> Reply
                </button>
              </div>
            </div>
          )}
          {!selectedMsg && !loadingDetail && !detailError && (
            <div className="flex-1 flex flex-col items-center justify-center text-[#9AAABF]">
              <div className="w-16 h-16 rounded-full bg-[#F4F7FB] flex items-center justify-center mb-4">
                <MailOpen size={28} />
              </div>
              <p className="text-[14px] font-medium">No mail selected</p>
              <p className="text-[12px] mt-1">Choose a message to read it here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
