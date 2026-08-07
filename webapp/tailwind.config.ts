import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── LinguaFlow palette (neutral dark) ───────────────────────────────
        canvas: "#0f0f0f",  // page background
        panel: "#141414",   // header / sidebar
        card: "#1a1a1a",    // cards, surfaces
        line: "#262626",    // borders
        hover: "#1f1f1f",   // hover background
        active: "#262626",  // active element background
        ink: "#fafafa",     // primary text
        dim: "#737373",     // secondary text
        accent: "#e5e5e5",  // accent / emphasis

        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
