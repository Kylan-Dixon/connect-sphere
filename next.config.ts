/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the correct way to expose build-time environment variables to your client-side code.
  env: {
    NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG,
  },
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
