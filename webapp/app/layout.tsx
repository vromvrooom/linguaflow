import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter, served from Google Fonts and self-hosted at build time by next/font
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LinguaFlow",
  description: "Language learning app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.className} ${inter.variable} bg-paper text-ink`}>
        {children}
      </body>
    </html>
  );
}
