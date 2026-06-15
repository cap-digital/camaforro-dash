import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fredoka } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

// Fonte de display festiva (títulos) — aproxima o espírito do São João de Camaçari
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Camaforró 2026 · Dashboard de Mídia",
  description:
    "Dashboard de performance das campanhas de mídia do Camaforró 2026 — O São João de Camaçari.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${fredoka.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
