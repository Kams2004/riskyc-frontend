"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listProducts } from "@/lib/api/products";
import { Product } from "@/lib/types";
import ProductCard from "@/components/products/ProductCard";
import { ArrowRight } from "lucide-react";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProducts({ size: 100 })
      .then((page) => setProducts(page.content))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Pick 8: prioritise badged items, spread across categories
  const featured = [
    ...products.filter((p) => p.badge === "HOT"),
    ...products.filter((p) => p.badge === "SALE"),
    ...products.filter((p) => p.badge === "NEW"),
    ...products.filter((p) => !p.badge),
  ]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i) // dedupe
    .slice(0, 8);

  return (
    <section className="py-16 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="section-title mb-2">Featured Products</h2>
            <p className="text-gray-500">Handpicked just for you</p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-brand-500 hover:text-brand-600 font-medium text-sm group"
          >
            View All
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No products yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 sm:hidden">
          <Link href="/products" className="btn-secondary">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
