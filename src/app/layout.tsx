import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { serifFont, headlineFont, playfairFont, montserratFont, interFont, loraFont, ralewayFont, openSansFont, notoSansTC, notoSansSC } from '@/lib/fonts'

export const metadata: Metadata = {
  title: "At-Home Micro-Infusion System for Skin Renewal | SkinCoach",
  description: "Transform your skin with our at-home Micro-Infusion System. Designed to support smoother texture, fine lines, and skin renewal—no clinic visit required.",
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
      <head>
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1193064696375296');fbq('track','PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1193064696375296&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
