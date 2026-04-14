import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talent Density OS",
  description: "Ledningsverktyg för att analysera, kalibrera och höja talent density i en ledningsgrupp."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
