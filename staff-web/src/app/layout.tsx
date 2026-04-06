import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Masjid Al-Momineen — Staff Portal",
  description: "Staff management portal for Masjid Al-Momineen.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.setItem('theme', 'light');
                document.documentElement.classList.remove('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
