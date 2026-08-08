import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── LinguaFlow palette (amber / warm) ───────────────────────────────
        paper: "#faf6f0",       // page background — warm cream
        surface: "#ffffff",     // cards
        sidebar: "#f5efe6",     // sidebar
        line: "#e8ddd0",        // borders
        ink: "#2c1810",         // primary text — dark brown
        dim: "#9c7c6a",         // secondary text
        brand: "#b5631a",       // warm amber / burnt orange
        "brand-dark": "#8f4d12",// accent hover
        "brand-soft": "#fdf0e3",// active item background
        success: "#6b9e5e",
        warm: "#fff8e7",        // streak banner

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
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
        "card-hover": "0 10px 24px rgba(0,0,0,0.09)",
        sidebar: "1px 0 3px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
