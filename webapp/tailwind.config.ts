import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── LinguaFlow palette (warm light) ─────────────────────────────────
        paper: "#f0ede8",       // page background — warm cream
        surface: "#faf8f5",     // cards
        sidebar: "#f5f2ed",     // sidebar
        line: "#ddd8cf",        // borders
        ink: "#1a1a1a",         // primary text
        dim: "#8b8580",         // secondary text
        brand: "#2d6a4f",       // muted deep green
        "brand-dark": "#1b4332",// accent hover
        "brand-soft": "#f0faf4",// active item background
        success: "#52b788",
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
