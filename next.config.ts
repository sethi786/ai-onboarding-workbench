import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The pure workbench engine/data/export modules are plain TS and safe to run
  // on the server. Nothing here needs a live DB at build time.
  eslint: {
    // Lint is run separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
