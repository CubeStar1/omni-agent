/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      remotePatterns: [
          {
              hostname: '*',
              protocol: 'https',
          },

      ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    serverComponentsExternalPackages: ["@voltagent/*", "npm-check-updates"],
  },
  
};

export default nextConfig;
