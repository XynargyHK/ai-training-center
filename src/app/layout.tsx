import type { Metadata } from "next";
import "./globals.css";
import { serifFont, headlineFont, playfairFont, montserratFont, interFont, loraFont, ralewayFont, openSansFont, notoSansTC, notoSansSC } from '@/lib/fonts'

export const metadata: Metadata = {
  title: "AI Business Center",
  description: "Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing",
  verification: {
    google: 'uk6LcLQTI6W1KKBgePLm46-M155maP8UbomgiylpoNs',
    other: {
      'msvalidate.01': '49785425477910BA8333B7070A3DF5AD',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serifFont.variable} ${headlineFont.variable} ${playfairFont.variable} ${montserratFont.variable} ${interFont.variable} ${loraFont.variable} ${ralewayFont.variable} ${openSansFont.variable} ${notoSansTC.variable} ${notoSansSC.variable}`}>
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
