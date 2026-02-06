/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        const exact = [
            "/dashboard",
            "/standup",
            "/agents",
            "/tasks",
            "/messages",
            "/activity",
            "/settings",
            "/registry",
            "/dashboard-v2",
            "/mission-control",
        ].map((source) => ({ source, destination: "/", permanent: true }));
        const withSlug = [
            { source: "/agents/:path*", destination: "/", permanent: true },
            { source: "/tasks/:path*", destination: "/", permanent: true },
        ];
        return [...exact, ...withSlug];
    },
    transpilePackages: ["lucide-react", "boring-avatars"],
};

export default nextConfig;
