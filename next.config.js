/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    domains: [
      'tcmkyzcbndmaqxfjvpfs.supabase.co', // Supabase storage domain
      'raw.githubusercontent.com', // For placeholder images if needed
      'images.unsplash.com', // For placeholder images if needed
      'picsum.photos',
      'fastly.picsum.photos',
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Remove experimental flag as server actions are now stable
  webpack: (config, { isServer }) => {
    // Add any custom webpack configurations here
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://js.stripe.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: https://*.supabase.co https://picsum.photos https://fastly.picsum.photos;
              font-src 'self';
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://tcmkyzcbndmaqxfjvpfs.supabase.co https://api.supabase.co https://gpt-store-backend.onrender.com https://www.mygenio.xyz http://localhost:3002;
              frame-src https://js.stripe.com;
              frame-ancestors 'none';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      }
    ]
  },
}

module.exports = nextConfig 