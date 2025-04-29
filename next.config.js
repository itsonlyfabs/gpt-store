/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'tcmkyzcbndmaqxfjvpfs.supabase.co', // Supabase storage domain
      'raw.githubusercontent.com', // For placeholder images if needed
      'images.unsplash.com', // For placeholder images if needed
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
}

module.exports = nextConfig 