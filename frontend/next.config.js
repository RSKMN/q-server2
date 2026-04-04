/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	compress: true,
	poweredByHeader: false,
	output: "standalone",
	images: {
		formats: ["image/avif", "image/webp"],
	},
};

module.exports = nextConfig;
