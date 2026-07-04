/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sistema-flores/types"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
