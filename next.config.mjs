/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimalizace obrázků pro maximální rychlost
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 rok pro maximální cachování
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Disable optimalizaci pro Supabase obrázky (rychlejší načítání)
    unoptimized: false,
  },
  transpilePackages: ['react-leaflet'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Komprese
  compress: true,
  // Production optimalizace
  productionBrowserSourceMaps: false,
  // React strict mode
  reactStrictMode: true,
  // SWC minifikace
  swcMinify: true,
}

export default nextConfig
