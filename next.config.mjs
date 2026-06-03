/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['escpos'],
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
};

export default nextConfig;
