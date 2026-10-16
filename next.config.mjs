import { networkInterfaces } from "node:os";

/**
 * `next dev` only: this computer's link-local addresses (169.254.x.x, such as the Npcap loopback adapter's, which
 * `next dev` prints as its "Network" address). Without them the dev server refuses its own scripts to a page opened
 * at such an address, and the page never becomes interactive. Ignored by production builds.
 */
const linkLocal = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && a.address.startsWith("169.254."))
  .map((a) => a.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: linkLocal,
};

export default nextConfig;
