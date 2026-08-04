/** @type {import('next').NextConfig} */
const nextConfig = {
  // La clave `eslint` dejó de soportarse en Next 16 (next lint se removió).
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
