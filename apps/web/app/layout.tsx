import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SilverLine B2B",
  description: "B2B Reseller Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
