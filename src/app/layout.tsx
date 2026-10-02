import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toast";
import { THEME_INIT_SCRIPT } from "@/lib/theme-storage";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display face for headings — matches marktcommerce.com's type system
// (Plus Jakarta Sans for display, Inter for body).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Absolute base for OpenGraph/canonical URLs. Set NEXT_PUBLIC_SITE_URL in
// production; falls back to localhost in dev so relative image/canonical URLs
// still resolve.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Markt — Shopping, the way it connects us.",
    template: "%s | Markt",
  },
  description:
    "Markt is a social-first commerce platform connecting local sellers and buyers — discover products through people, not just listings.",
  applicationName: "Markt",
  keywords: ["Markt", "marketplace", "local sellers", "social commerce", "shop local", "buy and sell"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Markt",
    title: "Markt — Shopping, the way it connects us.",
    description:
      "Discover products through people, not just listings. Follow local sellers, browse freely, and buy with confidence.",
    url: "/",
    images: [{ url: "/markt-text-logo.png", alt: "Markt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markt — Shopping, the way it connects us.",
    description:
      "Discover products through people, not just listings. Follow local sellers, browse freely, and buy with confidence.",
    images: ["/markt-text-logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script below sets data-theme on
    // <html> before React hydrates, so the server and client markup for
    // this element intentionally differ.
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-inter), var(--font-family)" }}
        // Browser extensions (Grammarly, password managers, etc.) inject
        // attributes like data-gr-ext-installed onto <body> before React
        // hydrates, which otherwise trips a false-positive hydration
        // mismatch warning that has nothing to do with this app's code.
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
