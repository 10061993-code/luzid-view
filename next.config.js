/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/p/:user/:date",
        destination: "/share/birth/:user/:date",
        permanent: true, // 308
      },
    ];
  },
};

module.exports = nextConfig;

