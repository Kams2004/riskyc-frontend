"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import ProductForm from "@/components/admin/ProductForm";
import { getProduct } from "@/lib/api/products";
import { Product } from "@/lib/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminShell>
        <div className="p-8 text-center text-sm text-gray-400">{t("adminProducts.common.loading")}</div>
      </AdminShell>
    );
  }

  if (!product) {
    return (
      <AdminShell>
        <div className="p-8 text-center">
          <p className="text-gray-400">{t("adminProducts.view.notFound")}</p>
          <Link
            href="/admin/products"
            className="text-brand-400 underline text-sm mt-2 inline-block"
          >
            {t("adminProducts.view.backToProducts")}
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <ProductForm mode="edit" initial={product} />
    </AdminShell>
  );
}
