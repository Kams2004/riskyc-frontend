import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Amina K.",
    location: "Douala",
    avatar: "AK",
    rating: 5,
    text: "Absolutely love my evening gown from Riskyc Fashion! The quality is outstanding and it arrived so quickly. Will definitely order again!",
    product: "Evening Gown",
  },
  {
    name: "Sophie T.",
    location: "Yaoundé",
    avatar: "ST",
    rating: 5,
    text: "The Blazer Set is exactly as pictured — even better in person. The payment process with Orange Money was super smooth.",
    product: "Blazer Set",
  },
  {
    name: "Marcus B.",
    location: "Buea",
    avatar: "MB",
    rating: 4,
    text: "Great selection of jerseys. The hoodie fits perfectly and the fabric is premium quality. Chat support was very responsive too!",
    product: "Oversized Hoodie",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="section-title mb-2">What Our Clients Say</h2>
        <p className="text-gray-500">Real reviews from real customers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="card p-6 border border-gray-100 hover:border-brand-100 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {t.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.location}</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-gold-500 fill-gold-500"
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              &ldquo;{t.text}&rdquo;
            </p>

            <div className="text-xs text-brand-500 font-medium bg-brand-50 px-2 py-1 rounded-full w-fit">
              Bought: {t.product}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
