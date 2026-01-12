import type { Metadata } from "next";
import "./globals.css";
import { serifFont, headlineFont, playfairFont, montserratFont, interFont, loraFont, ralewayFont, openSansFont } from '@/lib/fonts'

export const metadata: Metadata = {
  title: "AI Business Center",
  description: "Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serifFont.variable} ${headlineFont.variable} ${playfairFont.variable} ${montserratFont.variable} ${interFont.variable} ${loraFont.variable} ${ralewayFont.variable} ${openSansFont.variable}`}>
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
