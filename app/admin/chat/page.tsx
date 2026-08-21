"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminStore } from "@/lib/adminStore";
import * as conversationsApi from "@/lib/api/conversations";
import { useConversationSocket, useAdminNotificationSocket } from "@/lib/chatSocket";
import { useAdminTheme } from "@/lib/adminTheme";
import ConfirmDialog, { ConfirmState } from "@/components/admin/ConfirmDialog";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Plus,
  Trash2,
  User,
  Shield,
  Clock,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { Conversation, ChatMessage } from "@/lib/types";

const quickReplies = [
  "Your order has been validated! 🎉",
  "Your payment is being reviewed, please wait.",
  "We've received your payment proof, thank you!",
  "Your order has been shipped and will arrive soon.",
  "Sorry, your payment could not be verified. Please retry.",
  "Thank you for shopping with Riskyc Fashion! 💖",
  "Can you please re-upload a clearer screenshot?",
  "Our store is open Monday–Saturday, 9am–6pm.",
];

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function AdminChatPage() {
  const token = useAdminStore((s) => s.session?.token);
  const { theme } = useAdminTheme();
  const isDark = theme === "dark";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    conversationsApi.listConversations(token).then(setConversations).catch(() => {});
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useAdminNotificationSocket(refresh);

  const handleIncoming = useCallback((msg: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === msg.conversationId && !c.messages.some((m) => m.id === msg.id)
          ? { ...c, messages: [...c.messages, msg], lastMessageAt: msg.timestamp }
          : c
      )
    );
  }, []);

  useConversationSocket(selectedId, handleIncoming);

  const selectedConv: Conversation | undefined = conversations.find(
    (c) => c.id === selectedId
  );

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (selectedConv) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConv?.messages.length, selectedConv]);

  // Mark as read when opening a conversation
  const openConversation = (id: string) => {
    setSelectedId(id);
    setInput("");
    if (token) {
      conversationsApi.markConversationRead(id, token).catch(() => {});
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    }
  };

  const handleBack = () => {
    setSelectedId(null);
    setInput("");
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !selectedId) return;
    setInput("");
    const sent = await conversationsApi.sendMessage({ conversationId: selectedId, sender: "ADMIN", text: msg }, token ?? undefined);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId && !c.messages.some((m) => m.id === sent.id)
          ? { ...c, messages: [...c.messages, sent], lastMessageAt: sent.timestamp }
          : c
      )
    );
  };

  const handleNewConversation = async () => {
    if (!newName.trim()) return;
    const conv = await conversationsApi.createConversation({ customerName: newName.trim() });
    setNewName("");
    setShowNewForm(false);
    setConversations((prev) => [...prev, conv]);
    openConversation(conv.id);
  };

  const filteredConvs = conversations
    .filter((c) =>
      search
        ? c.customerName.toLowerCase().includes(search.toLowerCase()) ||
          c.orderId?.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? b.createdAt).getTime() -
        new Date(a.lastMessageAt ?? a.createdAt).getTime()
    );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  // ── Styling helpers ──────────────────────────────────────────────
  const panel = clsx(
    "rounded-2xl border transition-colors",
    isDark
      ? "bg-gray-800/60 border-gray-700/50"
      : "bg-white border-gray-200 shadow-sm"
  );
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const inputCls = clsx(
    "w-full border rounded-xl px-3 py-2 text-sm placeholder-gray-500 outline-none transition-colors",
    isDark
      ? "bg-gray-800 border-gray-700 text-white focus:border-brand-500"
      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-400"
  );

  // ─────────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      <div className="p-4 lg:p-6 h-full flex flex-col gap-4 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
          {selectedConv ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className={clsx(
                  "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
                  isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                )}
              >
                <ArrowLeft size={16} /> Back to conversations
              </button>
            </div>
          ) : (
            <div>
              <h1 className={clsx("text-2xl font-bold", textPrimary)}>
                Customer Chat
              </h1>
              <p className={clsx("text-sm mt-0.5", textSecondary)}>
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
                {totalUnread > 0 && (
                  <span className="ml-2 bg-brand-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnread} unread
                  </span>
                )}
              </p>
            </div>
          )}

          {!selectedConv && (
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
            >
              <Plus size={15} /> New Conversation
            </button>
          )}
        </div>

        {/* ── New conversation form ── */}
        {showNewForm && !selectedConv && (
          <div className={clsx(panel, "p-4 flex-shrink-0")}>
            <p className={clsx("text-sm font-semibold mb-3", textPrimary)}>
              Start new conversation
            </p>
            <div className="flex gap-2">
              <input
                className={clsx(inputCls, "flex-1")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewConversation()}
                placeholder="Customer name (e.g. Amina K.)"
                autoFocus
              />
              <button
                onClick={handleNewConversation}
                disabled={!newName.trim()}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className={clsx(
                  "px-3 py-2 rounded-xl text-sm transition-colors",
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Conversation list ── */}
        {!selectedConv && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* Search */}
            <div
              className={clsx(
                "flex items-center gap-2 border rounded-xl px-3 py-2 flex-shrink-0",
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              )}
            >
              <Search size={15} className="text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={clsx(
                  "bg-transparent text-sm outline-none flex-1",
                  isDark ? "text-white" : "text-gray-900"
                )}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredConvs.length === 0 ? (
                <div className="text-center py-20">
                  <MessageSquare
                    size={36}
                    className="mx-auto mb-3 text-gray-600"
                  />
                  <p className={clsx("text-sm", textSecondary)}>
                    No conversations yet
                  </p>
                </div>
              ) : (
                filteredConvs.map((conv) => {
                  const lastMsg = conv.messages[conv.messages.length - 1];
                  return (
                    <div
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className={clsx(
                        "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all group",
                        isDark
                          ? "bg-gray-800/60 border-gray-700/50 hover:bg-gray-700/60 hover:border-gray-600"
                          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
                        conv.unread > 0 &&
                          (isDark
                            ? "border-brand-500/30 bg-brand-500/5"
                            : "border-brand-200 bg-brand-50/30")
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={clsx(
                            "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold",
                            isDark
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {conv.customerName.charAt(0).toUpperCase()}
                        </div>
                        {conv.unread > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unread > 9 ? "9+" : conv.unread}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={clsx(
                              "font-semibold text-sm truncate",
                              conv.unread > 0
                                ? "text-brand-400"
                                : textPrimary
                            )}
                          >
                            {conv.customerName}
                          </p>
                          <span className={clsx("text-xs flex-shrink-0", textSecondary)}>
                            {timeAgo(conv.lastMessageAt ?? conv.createdAt)}
                          </span>
                        </div>
                        {conv.orderId && (
                          <p className="text-xs text-brand-400/70 font-mono truncate">
                            {conv.orderId}
                          </p>
                        )}
                        {lastMsg && (
                          <p
                            className={clsx(
                              "text-xs truncate mt-0.5",
                              textSecondary
                            )}
                          >
                            {lastMsg.sender === "ADMIN" ? "You: " : ""}
                            {lastMsg.text}
                          </p>
                        )}
                      </div>

                      {/* Right: message count + delete */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span
                          className={clsx(
                            "text-xs px-2 py-0.5 rounded-full",
                            isDark
                              ? "bg-gray-700 text-gray-400"
                              : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {conv.messages.length} msg
                          {conv.messages.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirm({
                              title: "Delete conversation?",
                              message: `This will permanently delete the conversation with ${conv.customerName}. This cannot be undone.`,
                              confirmLabel: "Delete",
                              onConfirm: async () => {
                                if (token) {
                                  await conversationsApi.deleteConversation(conv.id, token);
                                  setConversations((prev) => prev.filter((c) => c.id !== conv.id));
                                }
                                setConfirm(null);
                              },
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
                          title="Delete conversation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Conversation detail ── */}
        {selectedConv && (
          <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
            {/* Chat panel */}
            <div
              className={clsx(
                "flex-1 flex flex-col rounded-2xl border overflow-hidden",
                isDark
                  ? "bg-gray-800/60 border-gray-700/50"
                  : "bg-white border-gray-200 shadow-sm"
              )}
            >
              {/* Chat header */}
              <div
                className={clsx(
                  "flex items-center gap-3 px-5 py-4 border-b flex-shrink-0",
                  isDark
                    ? "bg-gray-900/50 border-gray-700/50"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                <div
                  className={clsx(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm",
                    isDark
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {selectedConv.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={clsx("font-semibold text-sm", textPrimary)}>
                    {selectedConv.customerName}
                  </p>
                  <p className={clsx("text-xs", textSecondary)}>
                    {selectedConv.messages.length} messages
                    {selectedConv.orderId && (
                      <span className="ml-2 text-brand-400 font-mono">
                        · {selectedConv.orderId}
                      </span>
                    )}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Clock size={12} className="text-gray-500" />
                  <span className={clsx("text-xs", textSecondary)}>
                    {timeAgo(selectedConv.lastMessageAt ?? selectedConv.createdAt)}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div
                className={clsx(
                  "flex-1 overflow-y-auto p-5 space-y-4",
                  isDark ? "bg-gray-900/20" : "bg-slate-50"
                )}
              >
                {selectedConv.messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare
                      size={32}
                      className="mx-auto mb-3 text-gray-500"
                    />
                    <p className={clsx("text-sm", textSecondary)}>
                      No messages yet. Say hello!
                    </p>
                  </div>
                ) : (
                  selectedConv.messages.map((msg) => {
                    const isAdmin = msg.sender === "ADMIN";
                    return (
                      <div
                        key={msg.id}
                        className={clsx(
                          "flex gap-2.5 animate-fade-in",
                          isAdmin ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div
                          className={clsx(
                            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                            isAdmin
                              ? isDark
                                ? "bg-brand-500/20 border border-brand-500/30"
                                : "bg-brand-500 shadow-sm"
                              : isDark
                              ? "bg-gray-700 border border-gray-600"
                              : "bg-gray-200 border border-gray-300"
                          )}
                        >
                          {isAdmin ? (
                            <Shield size={12} className={isDark ? "text-brand-400" : "text-white"} />
                          ) : (
                            <User
                              size={12}
                              className={isDark ? "text-gray-400" : "text-gray-500"}
                            />
                          )}
                        </div>

                        <div
                          className={clsx(
                            "max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                            isAdmin
                              ? isDark
                                ? "bg-brand-500/25 border border-brand-500/20 text-brand-100 rounded-br-sm"
                                : "bg-brand-500 text-white rounded-br-sm shadow-sm"
                              : isDark
                              ? "bg-gray-700/80 text-gray-100 rounded-bl-sm"
                              : "bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-sm"
                          )}
                        >
                          {msg.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.imageUrl}
                              alt="Shared photo"
                              className={clsx("rounded-xl max-w-full max-h-56 object-cover", msg.text ? "mb-1.5" : "")}
                            />
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          <p
                            className={clsx(
                              "text-[10px] mt-1",
                              isAdmin
                                ? isDark
                                  ? "text-brand-400/60 text-right"
                                  : "text-white/70 text-right"
                                : isDark
                                ? "text-gray-500"
                                : "text-gray-400"
                            )}
                          >
                            {isAdmin ? `${msg.adminSenderName ?? "Admin"} · ` : `${selectedConv.customerName} · `}
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div
                className={clsx(
                  "flex-shrink-0 px-4 py-4 border-t",
                  isDark
                    ? "border-gray-700/50 bg-gray-900/30"
                    : "border-gray-200 bg-white"
                )}
              >
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a reply… (Enter to send)"
                    rows={2}
                    className={clsx(
                      "flex-1 border rounded-xl px-4 py-2.5 text-sm resize-none outline-none transition-colors",
                      isDark
                        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-brand-500"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-brand-400"
                    )}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                      input.trim()
                        ? "bg-brand-500 hover:bg-brand-600 text-white shadow-lg"
                        : isDark
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick replies sidebar */}
            <div className="w-64 flex-shrink-0 hidden xl:flex flex-col gap-4">
              <div
                className={clsx(
                  "rounded-2xl border p-5 flex-1 overflow-y-auto",
                  isDark
                    ? "bg-gray-800/60 border-gray-700/50"
                    : "bg-white border-gray-200 shadow-sm"
                )}
              >
                <h3
                  className={clsx(
                    "font-semibold text-sm mb-4",
                    textPrimary
                  )}
                >
                  Quick Replies
                </h3>
                <div className="space-y-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className={clsx(
                        "w-full text-left text-xs px-3 py-2.5 rounded-xl transition-colors leading-relaxed border",
                        isDark
                          ? "text-gray-400 hover:text-white bg-gray-900/50 hover:bg-gray-700/50 border-transparent hover:border-gray-600"
                          : "text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-brand-50 border-gray-100 hover:border-brand-200"
                      )}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog state={confirm} onCancel={() => setConfirm(null)} />
    </AdminShell>
  );
}
