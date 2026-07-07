/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sistema-flores/types"],
  async redirects() {
    // "Catálogo" virou "Insumos" — mantém links antigos funcionando.
    return [{ source: "/catalogo", destination: "/insumos", permanent: false }];
  },
};

export default nextConfig;
