import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/welcome", "/login", "/buy", "/learn"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
