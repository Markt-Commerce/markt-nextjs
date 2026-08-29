import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Markt — Shopping, the way it connects us.",
    template: "%s | Markt",
  },
  description:
    "Markt is a social-first commerce platform connecting local sellers and buyers — discover products through people, not just listings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
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
      </body>
    </html>
  );
}
