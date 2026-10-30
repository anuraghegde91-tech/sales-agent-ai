import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://salesagentai.com"
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/reset-password"],
        disallow: ["/dashboard", "/meetings", "/create", "/edit", "/profile", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
