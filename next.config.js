/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['recharts', 'recharts-scale', 'd3-scale', 'd3-shape', 'd3-path'],
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
}

module.exports = nextConfig
