import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
}

module.exports = {
  eslint: {
    ignoreDuringBuilds: true, // Add this
  },
}


export default nextConfig
