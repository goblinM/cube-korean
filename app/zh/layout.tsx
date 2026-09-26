import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CubeKorean · 韩语生活词汇听写",
  description: "通过看词拼写、听音默写和错词复习，掌握真实生活中的韩语词汇。",
  alternates: { canonical: "/zh", languages: { "zh-CN": "/zh", en: "/en", "x-default": "/zh" } },
  openGraph: { locale: "zh_CN", url: "/zh", title: "CubeKorean · 韩语生活词汇听写", description: "通过看词拼写、听音默写和错词复习，掌握真实生活中的韩语词汇。" },
};

export default function ChineseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
