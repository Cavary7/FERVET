import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08111f",
        panel: "#0f1b2d",
        panelStrong: "#13233a",
        border: "#233552",
        muted: "#8da4c4",
        foreground: "#e8f0ff",
        accent: "#3b82f6",
        accentSoft: "#16325f",
        success: "#60a5fa",
      },
      boxShadow: {
        glow: "0 12px 40px rgba(59, 130, 246, 0.18)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
