import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDR Research Agent",
  description: "Pre-call research briefs, powered by AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
