/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite uma 2ª instância dev (ex.: auditoria mobile) sem brigar pelo .next
  // do dev principal — dois `next dev` no mesmo distDir corrompem os chunks.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@sistema-flores/types"],
  async redirects() {
    // "Catálogo" virou "Insumos" — mantém links antigos funcionando.
    return [{ source: "/catalogo", destination: "/insumos", permanent: false }];
  },
};

export default nextConfig;
