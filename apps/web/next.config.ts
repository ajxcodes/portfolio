import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This will create a standalone folder which can be deployed on its own.
  // It's essential for the optimized Dockerfile.
  output: "standalone",
};

export default nextConfig;
