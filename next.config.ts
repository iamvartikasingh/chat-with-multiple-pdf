// next.config.ts
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const config: NextConfig = {
  // Analyzer works with Webpack builds, so run `next build` (no --turbopack)
  experimental: {
    optimizePackageImports: [
      "date-fns",
      "lodash-es",
      "lucide-react",
      "@radix-ui/react-icons",
    ],
  },
  modularizeImports: {
    lodash: { transform: "lodash/{{member}}" },
    "date-fns": { transform: "date-fns/{{member}}" },
  },
};

export default withBundleAnalyzer(config);