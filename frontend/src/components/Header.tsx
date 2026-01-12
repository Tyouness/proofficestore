"use client"; // Obligatoire car on utilise le panier en temps réel

import Link from 'next/link';
import { useCart } from '@/context/CartContext'; // On importe le hook du panier

export default function Header() {
  const { cartCount } = useCart(); // On récupère le nombre d'articles

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity">
          AllKeyMasters
        </Link>
        
        {/* Navigation Centrale */}
        <nav className="hidden md:flex items-center space-x-8 text-[13px] font-medium text-gray-600">
          <Link href="/#products" className="hover:text-black transition-colors">Logiciels</Link>
          <Link href="/support" className="hover:text-black transition-colors">Support</Link>
        </nav>

        {/* Panier et Compte */}
        <div className="flex items-center space-x-6">
          <Link href="/cart" className="relative group p-2">
            {/* Icône Panier (Simple & Pro) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600 group-hover:text-black transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.11 4.634c.8 3.327-.19 6.747-2.612 9.2a43.122 43.122 0 0 1-1.287 1.206 43.122 43.122 0 0 1-1.287-1.206c-2.422-2.453-3.412-5.873-2.612-9.2l1.11-4.634c.15-.623.708-1.066 1.35-1.066h6.182c.642 0 1.2.443 1.35 1.066Z" />
            </svg>
            
            {/* Badge de notification (Apple Style) */}
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link href="/account" className="text-[12px] font-semibold bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all">
            Mon Compte
          </Link>
        </div>
      </div>
    </header>
  );
}