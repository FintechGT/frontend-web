// src/app/layout.tsx  (NO pongas "use client" aquí)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProviders } from "@/app/providers";
import { Toaster } from "sonner";
import AppLayoutClient from "@/app/AppLayoutClient";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "EmpeñosGT — Préstamos con garantía",
  description: "Solicita, gestiona y paga tus préstamos con garantía.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProviders>
          <AppLayoutClient>
            <Navbar />
            <main className="pt-14 min-h-[100svh]">{children}</main>
            <Toaster richColors position="top-center" />
          </AppLayoutClient>
        </ThemeProviders>
      </body>
    </html>
  );
}
