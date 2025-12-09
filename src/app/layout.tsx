import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BNI AI Center",
  description: "Train and manage AI agents with roleplay scenarios, knowledge management, and real-time testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
