import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Masjid Al-Momineen — Staff Portal",
  description: "Staff management portal for Masjid Al-Momineen. Manage prayers, students, donations, and community programs.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-950">
        {children}
      </body>
    </html>
  );
}
