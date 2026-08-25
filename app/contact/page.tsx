"use client";

import { useStore } from "@/lib/store";
import { MapPin, Phone, Mail, MessageCircle, Whatsapp, Clock } from "@/components/icons/fa";

const WHATSAPP_NUMBER = "237693456789";
const PHONE_DISPLAY = "+237 693 45 67 89";
const EMAIL = "contact@riskyc.cm";
const MAPS_QUERY = encodeURIComponent("Marché Central, Marché des Pommes, Douala, Cameroon");

export default function ContactPage() {
  const { setChatOpen } = useStore();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 min-h-[70vh]">
      <div className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl text-gray-900">Contact Us</h1>
        <p className="text-gray-500 mt-2">
          We&apos;d love to hear from you — reach out any way that&apos;s easiest.
        </p>
      </div>

      {/* Quick contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-green-200 hover:shadow-md transition-all"
        >
          <Whatsapp size={24} className="text-green-500" />
          <p className="text-sm font-semibold text-gray-800">WhatsApp</p>
          <p className="text-xs text-gray-400">{PHONE_DISPLAY}</p>
        </a>
        <a
          href="tel:+237693456789"
          className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
        >
          <Phone size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">Call Us</p>
          <p className="text-xs text-gray-400">{PHONE_DISPLAY}</p>
        </a>
        <a
          href={`mailto:${EMAIL}`}
          className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
        >
          <Mail size={24} className="text-brand-500" />
          <p className="text-sm font-semibold text-gray-800">Email</p>
          <p className="text-xs text-gray-400">{EMAIL}</p>
        </a>
      </div>

      {/* Store location */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 mb-1">Visit Our Store</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Marché Central, Douala
              <br />
              Précisément au Marché des Pommes
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              <MapPin size={14} /> Get Directions
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4 mt-5 pt-5 border-t border-gray-100">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Opening Hours</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Monday – Saturday: 8:00 AM – 6:30 PM
              <br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </div>

      {/* Live chat CTA */}
      <button
        onClick={() => setChatOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-brand-200 text-brand-600 hover:bg-brand-50 font-medium text-sm transition-colors"
      >
        <MessageCircle size={18} />
        Chat with us live
      </button>
    </div>
  );
}
