"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { getConversation, getConversationForCustomer, createConversation, sendMessage, sendImageMessage } from "@/lib/api/conversations";
import { useConversationSocket } from "@/lib/chatSocket";
import { ChatMessage } from "@/lib/types";
import { MessageCircle, X, Send, Minimize2, Paperclip } from "@/components/icons/fa";
import clsx from "clsx";

export default function ChatBlob() {
  const { chatOpen, setChatOpen, customer, conversationId, setConversationId, chatDraft, setChatDraft } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    getConversation(conversationId)
      .then((c) => setMessages(c.messages))
      .catch(() => {});
  }, [conversationId]);

  // A logged-in customer may already have a thread an admin started from the
  // order page — adopt it instead of starting a second, disconnected one.
  useEffect(() => {
    if (!customer || conversationId) return;
    getConversationForCustomer(customer.id)
      .then((c) => {
        if (c) {
          setConversationId(c.id);
          setMessages(c.messages);
        }
      })
      .catch(() => {});
  }, [customer, conversationId, setConversationId]);

  // Consume a one-shot prefill (e.g. "Ask about this product") into the input
  // + a staged image, then clear it so it doesn't re-apply on the next open.
  useEffect(() => {
    if (!chatOpen || !chatDraft) return;
    setInput(chatDraft.text);
    if (chatDraft.imageUrl) {
      fetch(chatDraft.imageUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], "product.jpg", { type: blob.type || "image/jpeg" });
          setStagedImage(file);
          setStagedPreview(URL.createObjectURL(file));
        })
        .catch(() => {});
    }
    setChatDraft(null);
  }, [chatOpen, chatDraft, setChatDraft]);

  const handleIncoming = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  useConversationSocket(conversationId, handleIncoming);

  useEffect(() => {
    if (chatOpen && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen, minimized]);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStagedImage(file);
    setStagedPreview(URL.createObjectURL(file));
  };

  const clearStagedImage = () => {
    if (stagedPreview) URL.revokeObjectURL(stagedPreview);
    setStagedImage(null);
    setStagedPreview(null);
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !stagedImage) || sending) return;
    const imageToSend = stagedImage;
    setInput("");
    clearStagedImage();
    setSending(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const name = customer ? `${customer.firstName} ${customer.lastName}` : "Guest";
        const conv = await createConversation({ customerName: name, customerId: customer?.id });
        convId = conv.id;
        setConversationId(convId);
        setMessages(conv.messages);
      }
      const msg = imageToSend
        ? await sendImageMessage(convId, "CUSTOMER", imageToSend, text)
        : await sendMessage({ conversationId: convId, sender: "CUSTOMER", text });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      // silently drop — the message stays in the input-less state; user can retry
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => m.sender === "ADMIN").length;

  return (
    <>
      {/* Chat window */}
      {chatOpen && (
        <div
          className={clsx(
            "fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300",
            minimized ? "h-14 overflow-hidden" : "h-[480px]"
          )}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 rounded-t-3xl flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">RF</span>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm leading-tight">
                Riskyc Fashion Support
              </p>
              <p className="text-brand-100 text-xs">Usually replies in minutes</p>
            </div>
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-xs text-gray-400 pt-8">
                Send us a message and our team will get back to you shortly.
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex gap-2 animate-slide-up",
                  msg.sender === "CUSTOMER" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {msg.sender === "ADMIN" && (
                  <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">RF</span>
                  </div>
                )}
                <div
                  className={clsx(
                    "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.sender === "CUSTOMER"
                      ? "bg-brand-500 text-white rounded-br-md"
                      : "bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100"
                  )}
                >
                  {msg.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.imageUrl}
                      alt="Shared photo"
                      className={clsx("rounded-xl max-w-full max-h-48 object-cover mb-1.5", msg.text ? "" : "mb-0")}
                    />
                  )}
                  {msg.text}
                  <div
                    className={clsx(
                      "text-[10px] mt-1",
                      msg.sender === "CUSTOMER"
                        ? "text-brand-200 text-right"
                        : "text-gray-400"
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white rounded-b-3xl flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePickImage}
              className="hidden"
            />
            {stagedPreview && (
              <div className="relative inline-block mb-2 ml-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stagedPreview} alt="Attached" className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
                <button
                  onClick={clearStagedImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center shadow"
                  title="Remove photo"
                >
                  <X size={11} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-brand-300 transition-colors">
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach a photo"
                className="text-gray-400 hover:text-brand-500 transition-colors flex-shrink-0"
              >
                <Paperclip size={16} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !stagedImage) || sending}
                className={clsx(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                  input.trim() || stagedImage
                    ? "bg-brand-500 text-white hover:bg-brand-600 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-1.5">
              Riskyc Fashion · Douala, Cameroon
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => {
          setChatOpen(!chatOpen);
          setMinimized(false);
        }}
        className={clsx(
          "fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
          chatOpen
            ? "bg-gray-800 hover:bg-gray-900"
            : "bg-gradient-to-br from-brand-500 to-brand-700"
        )}
      >
        {chatOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageCircle size={24} className="text-white" />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-400 text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
