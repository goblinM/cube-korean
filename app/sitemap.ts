import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/zh", "/en"].map((path) => ({
    url: new URL(path, SITE_URL).toString(),
    changeFrequency: "weekly" as const,
    priority: path === "/zh" ? 1 : 0.9,
    alternates: { languages: { "zh-CN": new URL("/zh", SITE_URL).toString(), en: new URL("/en", SITE_URL).toString() } },
  }));
}
