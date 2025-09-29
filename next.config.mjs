// next.config.mjs
import path from "path";

export default {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd()), // Alias '@' zeigt auf Projektroot
    };
    return config;
  },
};

