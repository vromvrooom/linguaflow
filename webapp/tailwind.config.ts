import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── LinguaFlow palette (neutral / slate) ────────────────────────────
        paper: "#fafafa",       // page background
        surface: "#ffffff",     // cards
        sidebar: "#f4f4f5",     // sidebar
        line: "#e4e4e7",        // borders
        "line-strong": "#d4d4d8", // border on card hover
        ink: "#09090b",         // primary text
        dim: "#71717a",         // secondary text
        brand: "#18181b",       // accent — near black
        "brand-dark": "#000000",// accent hover
        "brand-soft": "#f4f4f5",// active / subtle fill
        success: "#18181b",     // completion reads as neutral, not coloured
        warm: "#f4f4f5",        // streak banner

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
        card: "0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 1px 3px rgba(0,0,0,0.06)",
        sidebar: "none",
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
