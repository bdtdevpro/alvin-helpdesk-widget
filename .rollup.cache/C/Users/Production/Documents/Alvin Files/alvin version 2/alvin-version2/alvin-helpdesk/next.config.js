const nextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000', 'localhost:9003', '*.vercel.app'],
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
};
export default nextConfig;
//# sourceMappingURL=next.config.js.map