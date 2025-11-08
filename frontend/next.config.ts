import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy dashboard to new patient routes
  { source: "/dashboard", destination: "/patient/dashboard", permanent: false },
  { source: "/dashboard/:path*", destination: "/patient/:path*", permanent: false },
  // Registration moved under patient
  { source: "/register", destination: "/patient/register", permanent: false },
      // Fix old misspelled paitent to patient
      { source: "/paitent/:path*", destination: "/patient/:path*", permanent: true },
    ]
  },
};

export default nextConfig;
