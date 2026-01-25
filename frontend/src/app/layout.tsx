import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import { BUSINESS_INFO, SEO_CONFIG } from "@/config/business";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS_INFO.website),
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: `%s | ${BUSINESS_INFO.companyName}`,
  },
  description: SEO_CONFIG.defaultDescription,
  keywords: SEO_CONFIG.keywords,
  authors: [{ name: BUSINESS_INFO.companyName }],
  creator: BUSINESS_INFO.companyName,
  publisher: BUSINESS_INFO.companyName,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.jpg', type: 'image/jpeg', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.jpg', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BUSINESS_INFO.website,
    siteName: BUSINESS_INFO.companyName,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* On enveloppe tout le site pour que le panier soit accessible partout */}
        <CartProvider>
          <Header />
          <main className="section-spacing">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </CartProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}