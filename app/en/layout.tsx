import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CubeKorean · Korean spelling for everyday life",
  description: "Practice practical Korean spelling through copy exercises, audio dictation and focused mistake review.",
  alternates: { canonical: "/en", languages: { "zh-CN": "/zh", en: "/en", "x-default": "/zh" } },
  openGraph: { locale: "en_US", url: "/en", title: "CubeKorean · Korean spelling for everyday life", description: "Practice practical Korean spelling through copy exercises, audio dictation and focused mistake review." },
  manifest: "/manifest-en.webmanifest",
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
