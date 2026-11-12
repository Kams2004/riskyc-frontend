import type { Metadata } from "next";
import { getProduct } from "@/lib/api/products";
import { API_BASE_URL } from "@/lib/apiClient";
import ProductDetailClient from "./ProductDetailClient";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ photo?: string }> };

/** ?photo=N — which of the product's media the link was shared with (0 = first). */
function photoIndex(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { photo } = await searchParams;
  try {
    const product = await getProduct(id);
    // Route through our own API instead of the raw presigned MinIO URL —
    // that one can point at an internal-only host and always expires, both
    // of which break link-preview crawlers (WhatsApp, Facebook, etc.),
    // which need a stable, publicly reachable image URL at share time.
    // The photo the link was shared with (falls back to the first picture), resized by the site's image optimiser so
    // the preview stays light: WhatsApp drops preview images that are too heavy.
    const chosen = product.media[photoIndex(photo)];
    const media = chosen?.type === "IMAGE" ? chosen : product.media.find((m) => m.type === "IMAGE") ?? product.media[0];
    const image = media
      ? `/_next/image?url=${encodeURIComponent(`${API_BASE_URL}/api/media/${media.id}/content`)}&w=828&q=75`
      : undefined;
    const price = product.price > 0 ? `${Math.round(product.price).toLocaleString("fr-FR")} FCFA` : null;
    const description =
      product.description?.trim() ||
      `Shop ${product.name} at Riskyc Fashion — quality, style, and elegance delivered to your door.`;

    return {
      title: `${product.name} – Riskyc Fashion`,
      description,
      openGraph: {
        type: "website",
        siteName: "Riskyc Fashion",
        title: price ? `${product.name} — ${price}` : product.name,
        description,
        url: `/products/${id}${photo ? `?photo=${photoIndex(photo)}` : ""}`,
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

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { photo } = await searchParams;
  return <ProductDetailClient productId={id} initialPhoto={photoIndex(photo)} />;
}
