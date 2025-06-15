   /** @type {import('next').NextConfig} */
   const nextConfig = {
    // Comment this out during development
    // output: 'export',
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: { unoptimized: true },
  };
  
  module.exports = nextConfig;