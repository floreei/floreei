/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Landing é 100% estática (sem SSR/rotas dinâmicas/next-image) → exporta para
  // HTML estático em `out/`, servido pela Cloudflare Pages sem adapter.
  output: "export",
};

export default nextConfig;
