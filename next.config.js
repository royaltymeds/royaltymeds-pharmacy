/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  webpack: (config, { isServer }) => {
    // Exclude REFERENCE_APP directory from webpack builds
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/REFERENCE_APP/**', '**/node_modules/**'],
    };
    return config;
  },
  excludedDir: ['REFERENCE_APP'],
};

export default nextConfig;
