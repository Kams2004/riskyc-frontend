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
};

module.exports = nextConfig;
