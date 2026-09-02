"use client";

import { Truck, Phone, ImageIcon, MapPin } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";
import clsx from "clsx";

interface Props {
  contacts: { name: string; phone: string }[];
  /** Smaller variant for chat bubbles / inline previews — full size on the tracking page. */
  compact?: boolean;
}

/** The "here's our delivery team" card auto-attached to a packaging-confirmation message — see the admin order detail page and ConversationService.sendPackagingConfirmation. */
export default function DeliveryTeamCard({ contacts, compact }: Props) {
  const { t } = useTranslation();
  if (contacts.length === 0) return null;

  return (
    <div className={clsx("rounded-2xl border overflow-hidden bg-white", compact ? "border-teal-100" : "border-teal-200 shadow-sm")}>
      <div className={clsx("bg-gradient-to-r from-teal-500 to-teal-600 flex items-center gap-2", compact ? "px-3 py-2" : "px-4 py-3")}>
        <Truck size={compact ? 15 : 18} className="text-white flex-shrink-0" />
        <span className={clsx("text-white font-bold", compact ? "text-xs" : "text-sm")}>{t("common.deliveryCard.heading")}</span>
      </div>

      <div className={clsx("space-y-1.5", compact ? "p-2.5" : "p-4")}>
        {contacts.map((c, i) => (
          <a
            key={i}
            href={`tel:${c.phone.replace(/\s+/g, "")}`}
            className={clsx(
              "flex items-center gap-2.5 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors",
              compact ? "p-1.5" : "p-2.5"
            )}
          >
            <span
              className={clsx(
                "rounded-full bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0",
                compact ? "w-7 h-7" : "w-9 h-9"
              )}
            >
              <Phone size={compact ? 12 : 15} />
            </span>
            <div className="min-w-0">
              <p className={clsx("font-semibold text-gray-900 truncate", compact ? "text-xs" : "text-sm")}>{c.name}</p>
              <p className={clsx("text-gray-500", compact ? "text-[11px]" : "text-xs")}>{c.phone}</p>
            </div>
          </a>
        ))}
      </div>

      <div className={clsx("space-y-1 text-gray-500", compact ? "px-2.5 pb-2.5 text-[11px]" : "px-4 pb-3 text-xs")}>
        <p className="flex items-start gap-1.5">
          <Truck size={compact ? 11 : 12} className="mt-0.5 flex-shrink-0" /> {t("common.deliveryCard.instructionChoose")}
        </p>
        <p className="flex items-start gap-1.5">
          <ImageIcon size={compact ? 11 : 12} className="mt-0.5 flex-shrink-0" /> {t("common.deliveryCard.instructionPhoto")}
        </p>
        <p className="flex items-start gap-1.5">
          <MapPin size={compact ? 11 : 12} className="mt-0.5 flex-shrink-0" /> {t("common.deliveryCard.instructionGuide")}
        </p>
      </div>

      <div className={clsx("text-center font-medium text-teal-600 border-t border-teal-50", compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2 text-xs")}>
        {t("common.deliveryCard.thanks")}
      </div>
    </div>
  );
}
