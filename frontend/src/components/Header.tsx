"use client";

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Vérifier si l'utilisateur est connecté (simplifié sans appel API)
  useEffect(() => {
    // Vérification locale via cookie ou localStorage
    const checkAuthLocal = () => {
      try {
        // Vérifie si un cookie de session existe (sans faire d'appel API)
        const hasSession = document.cookie.includes('supabase-auth-token');
        setIsLoggedIn(hasSession);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuthLocal();
  }, []);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      setAccountMenuOpen(false);
    };
    if (accountMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    try {
      // Déconnexion Supabase côté client
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur de déconnexion:', error);
      }
      // Redirection vers la page d'accueil
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Redirection quand même en cas d'erreur
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg sm:text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity">
          AllKeyMasters
        </Link>
        
        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center space-x-8 text-[13px] font-medium text-gray-600">
          <Link href="/logiciels" className="hover:text-black transition-colors">Logiciels</Link>
          <Link href="/blog" className="hover:text-black transition-colors">Blog</Link>
          <Link href="/support" className="hover:text-black transition-colors">Support</Link>
        </nav>

        {/* Actions à droite */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Menu Hamburger Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-black transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Panier */}
          <Link href="/cart" className="relative group p-2" aria-label="Voir le panier">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-black transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Compte - Desktop */}
          <Link href="/account" className="hidden md:inline-block text-[12px] font-semibold bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all">
            Mon Compte
          </Link>

          {/* Compte - Mobile (icône bonhomme) */}
          <div className="relative md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAccountMenuOpen(!accountMenuOpen);
              }}
              className="p-2 text-gray-600 hover:text-black transition-colors"
              aria-label="Compte"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Dropdown menu compte mobile */}
            {accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 animate-fadeIn">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Mon Compte
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      S'inscrire
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Mobile Slide-in */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-slideDown">
          <nav className="px-4 py-3 space-y-1">
            <Link
              href="/logiciels"
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Logiciels
            </Link>
            <Link
              href="/blog"
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/support"
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Support
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}