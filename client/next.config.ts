import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '**.pinimg.com' },
      { hostname: '**.succulentplant.in' },
      { hostname: '**.nainileaf.com' },
      { hostname: '**.ebayimg.com' },
      { hostname: '**.gardening4joy.com' },
      { hostname: '**.jnsucculents.com' },
      { hostname: '**.plantsden.com' },
      { hostname: '**.insucculentlove.com' },
      { hostname: '**.etsystatic.com' },
      { hostname: '**.worldofsucculents.com' },
      { hostname: '**.thursd.com' },
      { hostname: '**.ugaoo.com' },
      { hostname: '**.blozem.com' },
      { hostname: '**.garden.org' },
      { hostname: '**.paisleyplants.com' },
      { hostname: '**.futurecdn.net' },
      { hostname: '**.pepperfry.com' },
      { hostname: '**.media-amazon.com' },
      { hostname: '**.nurserylive.com' },
      { hostname: '**.floresfrescas.com' },
      { hostname: '**.walmartimages.com' },
      { hostname: '**.agribotix.com' },
    ],
  },
};

export default nextConfig;