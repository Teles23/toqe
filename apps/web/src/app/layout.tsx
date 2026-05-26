import React from "react";
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { GoogleProvider } from "@/shared/providers/google-oauth-provider";
import { AuthProvider } from "@/shared/providers/auth-provider";
import { QueryProvider } from "@/shared/providers/query-provider";
import { Toaster } from "@/shared/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: {
    default: "Toqe — Gestão para Barbearias",
    template: "%s | Toqe",
  },
  description: "Sistema de gestão para barbearias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="pt-BR" className="dark" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${sora.variable}`}>
        <GoogleProvider>
          <ThemeProvider defaultTheme="dark">
            <QueryProvider>
              <AuthProvider>
                <Toaster />
                {children}
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
