import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages export raw TypeScript source, so Next must compile them.
  transpilePackages: ["@vhg/ui", "@vhg/engine"],
};

export default nextConfig;
