/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    config.resolve.fallback = {
      fs: false,
    }
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';

    return config
  },
};

export default nextConfig;
