/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'wkmqzhjwksgifeebckhr.supabase.co',
        pathname: '**',
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@mui/material'],
    typedRoutes: false,
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Fix client reference issues with special route groups
    serverComponentsExternalPackages: [],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // This is critical for fixing the auth-layout issue
  output: 'standalone',
  // Improve build time and reduce errors with route groups
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          // These are the specific plugins that help with route groups and client components
          plugins: ['@babel/plugin-transform-react-jsx']
        }
      }
    });
    return config;
  }
};

module.exports = nextConfig;
