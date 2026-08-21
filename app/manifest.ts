import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Riskyc Fashion",
    short_name: "Riskyc",
    description:
      "Discover the latest fashion dresses, jerseys, and more at Riskyc Fashion — quality, style, and elegance delivered to your door.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff1a5e",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
