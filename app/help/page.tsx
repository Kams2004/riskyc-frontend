"use client";

import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw, MessageCircle, Mail } from "@/components/icons/fa";

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse our products, add items to your cart, then head to checkout. Choose Orange Money or MTN Mobile Money to pay, and upload your payment screenshot to confirm.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Orange Money and MTN Mobile Money transfers. Dial *150# for Orange Money or *126# for MTN MoMo, or use their apps directly.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery typically takes 2–4 business days within Cameroon. Orders above 50,000 XAF qualify for free delivery.",
  },
  {
    q: "Can I track my order?",
    a: "Yes — create an account or log in, then check the \"My Orders\" section from the account menu in the header.",
  },
  {
    q: "What is your return policy?",
    a: "Items can be returned within 7 days of delivery if unworn and in original condition. Contact us via chat to start a return.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl text-gray-900">Help Center</h1>
        <p className="text-gray-500 mt-2">
          Answers to common questions about orders, payment, and delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <Truck size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">Fast Delivery</p>
          <p className="text-xs text-gray-400">2–4 business days</p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <ShieldCheck size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">Secure Pay</p>
          <p className="text-xs text-gray-400">Orange &amp; MTN Money</p>
        </div>
        <div className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <RotateCcw size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">Easy Return</p>
          <p className="text-xs text-gray-400">Within 7 days</p>
        </div>
      </div>

      <div className="space-y-3 mb-12">
        {faqs.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4 open:shadow-md transition-shadow"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sm text-gray-800">
              {item.q}
              <span className="text-brand-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-6 text-center">
        <p className="font-semibold text-brand-700 mb-1">Still need help?</p>
        <p className="text-sm text-gray-500 mb-4">Our support team is here for you.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle size={16} /> Chat with us
          </Link>
          <a
            href="mailto:support@riskycfashion.com"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-300 text-brand-600 text-sm font-semibold hover:bg-brand-100 transition-colors"
          >
            <Mail size={16} /> Email Support
          </a>
        </div>
      </div>
    </div>
  );
}
