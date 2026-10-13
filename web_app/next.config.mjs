/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // CSV data files (src/config/foi_params.csv) import as their text.
    config.module.rules.push({ test: /\.csv$/, type: 'asset/source' });
    return config;
  },
};

export default nextConfig;
