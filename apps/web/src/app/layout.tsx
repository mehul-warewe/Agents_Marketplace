import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import Providers from "@/components/Providers";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "warewe | Autonomous Agent Platform",
  description: "High-fidelity autonomous agent infrastructure with the warewe design system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-inter antialiased bg-background text-foreground`}>
        <AuthProvider>
          <Providers>
            <ToastProvider>
              {children}
            </ToastProvider>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
