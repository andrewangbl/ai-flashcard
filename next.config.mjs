/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    config.resolve.fallback = {
      fs: false,
    }
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    return config
  },
};

export default nextConfig;
