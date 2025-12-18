import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Performance optimizations
  experimental: {
    // Tree-shake large packages to only include what's used
    optimizePackageImports: ['recharts', 'framer-motion', 'lucide-react'],
  },
};

export default nextConfig;
