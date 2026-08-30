import type { Metadata } from "next";
import { getProduct } from "@/lib/api/products";
import { API_BASE_URL } from "@/lib/apiClient";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    // Route through our own API instead of the raw presigned MinIO URL —
    // that one can point at an internal-only host and always expires, both
    // of which break link-preview crawlers (WhatsApp, Facebook, etc.),
    // which need a stable, publicly reachable image URL at share time.
    const firstMedia = product.media.find((m) => m.type === "IMAGE") ?? product.media[0];
    const image = firstMedia ? `${API_BASE_URL}/api/media/${firstMedia.id}/content` : undefined;
    const description =
      product.description?.trim() ||
      `Shop ${product.name} at Riskyc Fashion — quality, style, and elegance delivered to your door.`;

    return {
      title: `${product.name} – Riskyc Fashion`,
      description,
      openGraph: {
        title: product.name,
        description,
        url: `/products/${id}`,
        images: image ? [{ url: image, alt: product.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: image ? [image] : undefined,
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
