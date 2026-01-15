"use client";

/**
 * CartContext - Gestion du panier e-commerce
 * 
 * RÈGLES STRICTES :
 * - product_id = slug du produit Supabase
 * - Variantes : digital | dvd | usb
 * - Quantité : 1-100
 * - Persistance localStorage
 * - Pas de clearCart automatique (géré par webhook Stripe)
 * - Calculs prix pour UI uniquement
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CART_STORAGE_KEY = 'allkeymasters_cart';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export type CartItem = {
  id: string;           // Slug du produit (ex: 'win-11-pro')
  title: string;        // Nom du produit
  price: number;        // Prix unitaire selon format (pour UI uniquement)
  format: 'digital' | 'dvd' | 'usb';
  quantity: number;     // Entre 1 et 100
  image?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string, format: string) => void;
  updateQuantity: (id: string, format: string, quantity: number) => void;
  clearCart: () => void;  // Vider complètement le panier (après paiement)
  totalPrice: number;
  cartCount: number;
  isLoaded: boolean;    // Indique si le panier a été chargé depuis localStorage
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // ──────────────────────────────────────────────
  // Chargement depuis localStorage (ONCE)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      }
    } catch (error) {
      console.error('[CART] Erreur lors du chargement:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []); // Dépendances vides = exécution unique

  // ──────────────────────────────────────────────
  // Sauvegarde dans localStorage (à chaque changement)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('[CART] Erreur lors de la sauvegarde:', error);
    }
  }, [items, isLoaded]);

  // ──────────────────────────────────────────────
  // Calcul des totaux (UI uniquement)
  // ──────────────────────────────────────────────
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    setTotalPrice(total);
    setCartCount(count);
  }, [items]);

  // ──────────────────────────────────────────────
  // Ajouter au panier
  // ──────────────────────────────────────────────
  const addToCart = (productToAdd: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (item) => item.id === productToAdd.id && item.format === productToAdd.format
      );

      if (existingItemIndex > -1) {
        // Incrémenter la quantité (max 100)
        const newItems = [...currentItems];
        const newQuantity = Math.min(newItems[existingItemIndex].quantity + 1, 100);
        newItems[existingItemIndex].quantity = newQuantity;
        return newItems;
      }

      // Ajouter nouvel item
      return [...currentItems, { ...productToAdd, quantity: 1 }];
    });
  };

  // ──────────────────────────────────────────────
  // Supprimer du panier
  // ──────────────────────────────────────────────
  const removeFromCart = (id: string, format: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => !(item.id === id && item.format === format))
    );
  };

  // ──────────────────────────────────────────────
  // Mettre à jour la quantité
  // ──────────────────────────────────────────────
  const updateQuantity = (id: string, format: string, quantity: number) => {
    if (quantity < 1 || quantity > 100) return;

    setItems((currentItems) => {
      const itemIndex = currentItems.findIndex(
        (item) => item.id === id && item.format === format
      );

      if (itemIndex === -1) return currentItems;

      const newItems = [...currentItems];
      newItems[itemIndex].quantity = quantity;
      return newItems;
    });
  };

  // ──────────────────────────────────────────────
  // Vider complètement le panier
  // ⚠️ APPELÉ UNIQUEMENT après confirmation paiement
  // ──────────────────────────────────────────────
  const clearCart = () => {
    console.log('[CART] 🗑️ Vidage du panier');
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        updateQuantity,
        clearCart,
        totalPrice, 
        cartCount,
        isLoaded 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Hook personnalisé
// ──────────────────────────────────────────────
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart doit être utilisé dans un CartProvider");
  }
  return context;
}