/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['s3-alpha.figma.com'],
  },
}

module.exports = nextConfig
