"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  email: string;
}

export default function AuthChoiceModal({ isOpen, onClose, onContinueAsGuest, email }: AuthChoiceModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Avant de continuer
        </h2>
        <p className="text-gray-600 mb-6">
          Vous n'êtes pas connecté. Choisissez une option :
        </p>

        {/* Option 1: Se connecter */}
        <button
          onClick={() => {
            router.push(`/login?redirect=/checkout&email=${encodeURIComponent(email)}`);
          }}
          className="w-full bg-black text-white px-6 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all mb-3 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <div className="font-bold">Se connecter</div>
              <div className="text-sm text-gray-300">J'ai déjà un compte</div>
            </div>
          </div>
        </button>

        {/* Option 2: S'inscrire */}
        <button
          onClick={() => {
            router.push(`/register?redirect=/checkout&email=${encodeURIComponent(email)}`);
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:opacity-90 transition-all mb-3 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <div className="font-bold">Créer un compte</div>
              <div className="text-sm text-blue-100">Support prioritaire inclus</div>
            </div>
          </div>
        </button>

        {/* Option 3: Continuer sans compte */}
        <button
          onClick={() => {
            onContinueAsGuest();
            onClose();
          }}
          className="w-full bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <div className="font-bold">Continuer sans compte</div>
              <div className="text-sm text-gray-500">Clé envoyée par email uniquement</div>
            </div>
          </div>
        </button>

        {/* Avertissement */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm text-amber-900">
              <strong className="block mb-1">Sans compte :</strong>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                <li>Support par email uniquement (24-48h de délai)</li>
                <li>Pas d'accès au système de tickets rapide</li>
                <li>Pas d'historique de commandes</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
