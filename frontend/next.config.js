import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

const remotePatterns = [{
  protocol: "https",
  hostname: "flagcdn.com",
  pathname: "/**",
}];

const addMediaRemotePattern = (baseUrl) => {
  const mediaUrl = new URL(baseUrl);
  const pathname = mediaUrl.pathname.replace(/\/+$/, "");

  remotePatterns.push({
    protocol: mediaUrl.protocol.replace(":", ""),
    hostname: mediaUrl.hostname,
    port: mediaUrl.port,
    pathname: `${pathname || ""}/**`,
  });
};

const isDevelopment = process.env.NODE_ENV === "development";
const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  || (isDevelopment ? "http://localhost:4000/uploads/public" : null);

if (mediaBaseUrl) {
  addMediaRemotePattern(mediaBaseUrl);
}

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns,
    qualities: [10, 25, 50, 75, 90, 100],
    dangerouslyAllowLocalIP: isDevelopment,
  },
};

export default withNextIntl(nextConfig);
