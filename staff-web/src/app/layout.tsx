import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"Masjid Community · Sanctuary",description:"A connected, welcoming mosque and community experience."};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
