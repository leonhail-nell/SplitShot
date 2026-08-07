import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@splitshot/shared"],
  // Monorepo: lockfile lives at workspace root
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  serverExternalPackages: ["@prisma/adapter-neon"],
};

export default nextConfig;
