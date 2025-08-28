/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@supabase/supabase-js')
    }
    return config
  }
};

export default nextConfig;
