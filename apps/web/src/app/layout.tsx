import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Nonley - You are never alone on the internet",
    template: "%s | Nonley",
  },
  description:
    "The presence layer of the internet. See who else is experiencing the same thing as you, right now.",
  metadataBase: new URL("https://nonley.com"),
  openGraph: {
    title: "Nonley - You are never alone on the internet",
    description: "The presence layer of the internet.",
    url: "https://nonley.com",
    siteName: "Nonley",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nonley",
    description: "You are never alone on the internet.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
