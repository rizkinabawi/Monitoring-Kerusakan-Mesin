import type { NextConfig } from "next";

const basePath = (process.env.BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  allowedDevOrigins: ["*.replit.dev", "*.replit.app", "127.0.0.1", "localhost"],
  poweredByHeader: false,
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;