import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AllKeyMasters - Licences Microsoft Officielles",
  description: "Achetez vos clés Windows et Office au meilleur prix avec livraison instantanée.",
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
      </body>
    </html>
  );
}