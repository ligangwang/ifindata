import type { NextConfig } from "next";

const allowedDevOrigins = [
  "127.0.0.1",
  "0.0.0.0",
  "*.app.github.dev",
  "*.github.dev",
  "github.dev",
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  output: "standalone",
};

export default nextConfig;
