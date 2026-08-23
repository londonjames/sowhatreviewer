import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "What's the So What?",
  description: "Paste a document. Find out if your point lands.",
  icons: {
    // Versioned: the icon URL has to change or Chrome keeps serving the icon it
    // already cached for this path, however many times the file is redeployed.
    icon: { url: "/icon.svg?v=2", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${garamond.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
