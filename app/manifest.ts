import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "./site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · 韩语生活词汇听写`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#171914",
    lang: "zh-CN",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
}
