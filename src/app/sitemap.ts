import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/terms", "/privacy", "/refund"].map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly", priority: p ? 0.3 : 1 }));
}
