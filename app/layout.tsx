import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://salesagentai.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Sales Agent AI — Field Intelligence Platform",
    template: "%s | Sales Agent AI",
  },
  description:
    "AI-powered pre-meeting briefs for field sales reps. Walk into every hospital meeting with real-time intelligence, personalised pitch points, and full CRM deal tracking.",
  keywords: [
    "sales agent AI",
    "field sales intelligence",
    "hospital sales CRM",
    "AI meeting brief",
    "healthcare sales tool",
    "pre-meeting prep",
    "sales rep AI assistant",
    "hospital meeting preparation",
    "HIS LIS EMR sales",
    "deal pipeline tracker",
  ],
  authors: [{ name: "Sales Agent AI", url: BASE_URL }],
  creator: "Sales Agent AI",
  publisher: "Sales Agent AI",

  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["en_US"],
    url: BASE_URL,
    siteName: "Sales Agent AI",
    title: "Sales Agent AI — Walk in prepared. Every time.",
    description:
      "AI-powered pre-meeting briefs for field sales reps. Real-time hospital intelligence, personalised pitch points & CRM deal tracking.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Sales Agent AI — Field Intelligence Platform" }],
  },

  twitter: {
    card: "summary_large_image",
    site: "@salesagentai",
    creator: "@salesagentai",
    title: "Sales Agent AI — Walk in prepared. Every time.",
    description: "AI-powered pre-meeting briefs for field sales reps.",
    images: ["/opengraph-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },

  manifest: "/manifest.json",

  alternates: {
    canonical: BASE_URL,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0D1117" },
    { media: "(prefers-color-scheme: light)", color: "#58A6FF" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#0D1117]">
      <body className="font-sans antialiased bg-[#0D1117]">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
