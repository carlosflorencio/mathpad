import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/mathpad",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
}

export default nextConfig
