/** The API host this build talks to (e.g. a local backend in development), allowed for resized product photos. */
function apiImagePattern() {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || "");
    if (u.hostname === "api.riskycfashion.com") return [];
    return [{ protocol: u.protocol.replace(":", ""), hostname: u.hostname, port: u.port, pathname: "/api/media/**" }];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — the Docker build copies only the compiled server +
  // its traced dependencies, not the whole node_modules tree.
  output: "standalone",
  images: {
    remotePatterns: [
      // Product photos served by the API (/api/media/{id}/content) — resized for link previews.
      { protocol: "https", hostname: "api.riskycfashion.com", pathname: "/api/media/**" },
      ...apiImagePattern(),
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      // The product listing is now the landing page (/) — keep the old
      // /products URL working (bookmarks, existing links) via a permanent
      // redirect instead of serving the same content at two URLs.
      { source: "/products", destination: "/", permanent: true },
    ];
  },
};

module.exports = nextConfig;
