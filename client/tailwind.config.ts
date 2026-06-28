import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: "rgba(255, 255, 255, 0.45)",
          dark: "rgba(18, 30, 26, 0.65)",
          border: "rgba(255, 255, 255, 0.12)",
          "border-dark": "rgba(255, 255, 255, 0.05)"
        },
        brand: {
          forest: "hsl(164, 86%, 16%)",
          mint: "hsl(162, 76%, 41%)",
          gold: "hsl(38, 92%, 50%)",
          coral: "hsl(343, 85%, 55%)"
        }
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px"
      },
      animation: {
        "shimmer": "shimmer 2.5s infinite linear",
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "float": "float 4s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)" },
          "50%": { boxShadow: "0 0 35px rgba(16, 185, 129, 0.6)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: [],
};
export default config;
