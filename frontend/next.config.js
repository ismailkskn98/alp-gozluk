import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

const remotePatterns = [];
const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

remotePatterns.push({
  protocol: "https",
  hostname: "flagcdn.com",
  pathname: "/**",
});

if (mediaBaseUrl) {
  const mediaUrl = new URL(mediaBaseUrl);
  remotePatterns.push({
    protocol: mediaUrl.protocol.replace(":", ""),
    hostname: mediaUrl.hostname,
    port: mediaUrl.port,
    pathname: "/**",
  });
}

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { remotePatterns, qualities: [10, 25, 50, 75, 90, 100] },
};

export default withNextIntl(nextConfig);
