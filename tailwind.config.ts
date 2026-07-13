import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF7",
        ink: "#18181B",
        muted: "#71717A",
        line: "#E4E4E7",
        teal: {
          500: "#14B8A6",
          600: "#0D9488"
        },
        action: "#2563EB",
        medal: {
          gold: "#FBBF24",
          silver: "#CBD5E1",
          bronze: "#C08457"
        }
      },
      boxShadow: {
        ranked: "0 0 0 1px rgba(20,184,166,.28), 0 12px 36px rgba(20,184,166,.12)",
        soft: "0 10px 30px rgba(24,24,27,.07)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
