import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1019",
        foreground: "#E5EEFF",
        card: "#111B2A",
        cardForeground: "#D8E7FF",
        electricBlue: "#2B7FFF",
        emerald: "#2FCC9A",
        muted: "#7A8AA7",
        border: "rgba(164, 191, 255, 0.16)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(72, 127, 255, 0.25), 0 12px 48px rgba(20, 44, 84, 0.45)"
      },
      borderRadius: {
        "2xl": "1rem"
      }
    }
  },
  plugins: []
};

export default config;
