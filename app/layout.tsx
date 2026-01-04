import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Driven Future - News Portal",
  description: "Stay ahead with AI-powered insights. Bloomberg Terminal meets The Matrix.",
  // ============================================================================
  // OPEN GRAPH (OG) TAGS - Copyright Compliant
  // ============================================================================
  // Social Media Preview: Controls how your site appears when shared on
  // Facebook, LinkedIn, Twitter, Slack, Discord, etc.
  // Last Updated: 2026-01-04
  // ============================================================================
  openGraph: {
    title: "AI Driven Future - Real-Time AI News & Insights",
    description: "Stay ahead with AI-powered insights. Bloomberg Terminal meets The Matrix.",
    url: "https://www.aidrivenfuture.ca",
    siteName: "AI Driven Future",
    images: [
      {
        url: "https://www.aidrivenfuture.ca/assets/images/og-brand-banner.png.svg",
        width: 1200,
        height: 630,
        alt: "AI Driven Future - Real-Time AI News & Insights",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Twitter Card (X.com)
  twitter: {
    card: "summary_large_image",
    title: "AI Driven Future - Real-Time AI News",
    description: "Stay ahead with AI-powered insights. Bloomberg Terminal meets The Matrix.",
    images: ["https://www.aidrivenfuture.ca/assets/images/og-brand-banner.png.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
