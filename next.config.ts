import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Link previews arrive from Telegram and X, whose crawlers do not run JS.
  // Metadata must be server-rendered into the initial HTML — see app/layout.tsx.
  typedRoutes: false,
};

export default nextConfig;
