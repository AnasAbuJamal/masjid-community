import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SILA · Mosque Community",
  description: "A connected, welcoming mosque and community experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#page-content">Skip to page content</a>
        <div id="page-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
