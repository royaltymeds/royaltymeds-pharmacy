/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  watchPathIgnorePatterns: [
    '.*\\.md$',        // Ignore markdown files
    '.*\\.command$',   // Ignore command files
    'docs/.*',         // Ignore entire docs folder
    'scripts/.*',      // Ignore scripts folder
  ],
};

export default nextConfig;
