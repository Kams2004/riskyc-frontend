import type { Metadata } from "next";
import { getProduct } from "@/lib/api/products";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    const image = product.media[0]?.presignedUrl;
    const description =
      product.description?.trim() ||
      `Shop ${product.name} at Riskyc Fashion — quality, style, and elegance delivered to your door.`;

    return {
      title: `${product.name} – Riskyc Fashion`,
      description,
      openGraph: {
        title: product.name,
        description,
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return { title: "Product – Riskyc Fashion" };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailClient productId={id} />;
}
