/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Handle @react-pdf/renderer dependencies
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
      });
    }
    
    // Fix for bidi-js and other React PDF dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}

module.exports = nextConfig
