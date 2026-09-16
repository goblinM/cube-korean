import type { MetadataRoute } from "next";
import { INDEXING_ALLOWED, SITE_URL } from "./site-config";

export default function robots(): MetadataRoute.Robots {
  return INDEXING_ALLOWED
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: new URL("/sitemap.xml", SITE_URL).toString(), host: SITE_URL.origin }
    : { rules: { userAgent: "*", disallow: "/" } };
}
