"use client";

import { Star } from "@/components/icons/fa";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Amina K.",
      location: "Douala",
      avatar: "AK",
      rating: 5,
      text: t("home.testimonials.reviews.amina.text"),
      product: t("home.testimonials.reviews.amina.product"),
    },
    {
      name: "Sophie T.",
      location: "Yaoundé",
      avatar: "ST",
      rating: 5,
      text: t("home.testimonials.reviews.sophie.text"),
      product: t("home.testimonials.reviews.sophie.product"),
    },
    {
      name: "Marcus B.",
      location: "Buea",
      avatar: "MB",
      rating: 4,
      text: t("home.testimonials.reviews.marcus.text"),
      product: t("home.testimonials.reviews.marcus.product"),
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="section-title mb-2">{t("home.testimonials.sectionTitle")}</h2>
        <p className="text-gray-500">{t("home.testimonials.sectionSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((item) => (
          <div
            key={item.name}
            className="card p-6 border border-gray-100 hover:border-brand-100 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {item.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">{item.location}</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-gold-500 fill-gold-500"
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              &ldquo;{item.text}&rdquo;
            </p>

            <div className="text-xs text-brand-500 font-medium bg-brand-50 px-2 py-1 rounded-full w-fit">
              {t("home.testimonials.boughtLabel", { product: item.product })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
