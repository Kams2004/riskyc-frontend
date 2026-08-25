/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — the Docker build copies only the compiled server +
  // its traced dependencies, not the whole node_modules tree.
  output: "standalone",
  images: {
    remotePatterns: [
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
