import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StorageUnavailableNotice } from "./components/storage-unavailable-notice";
import { INDEXING_ALLOWED, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: `${SITE_NAME} · 韩语生活词汇听写`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: INDEXING_ALLOWED ? { index: true, follow: true } : { index: false, follow: false, noarchive: true },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · 韩语生活词汇听写`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "CubeKorean 韩语生活词汇听写" }],
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} · 韩语生活词汇听写`, description: SITE_DESCRIPTION, images: ["/og-image.svg"] },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "32x32" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171914",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <StorageUnavailableNotice />
      </body>
    </html>
  );
}
