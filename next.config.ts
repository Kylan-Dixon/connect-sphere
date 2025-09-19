/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // This rule specifically targets the manifest.json file.
        source: '/manifest.json',
        headers: [
          // This allows the file to be requested from any origin.
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
