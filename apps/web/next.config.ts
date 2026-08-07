import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@splitshot/shared"],
  // Monorepo: lockfile lives at workspace root
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
