import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisaFile — Your DS-160, made manageable",
  description: "A calm, guided way to prepare your DS-160 visa application.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
