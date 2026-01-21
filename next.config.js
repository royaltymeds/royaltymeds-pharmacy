/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude REFERENCE_APP directory from webpack builds
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/REFERENCE_APP/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
