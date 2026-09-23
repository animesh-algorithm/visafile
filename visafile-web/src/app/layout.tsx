import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisaFile — Request early access",
  description:
    "Explore VisaFile and request early access to a calmer DS-160 preparation experience.",
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
