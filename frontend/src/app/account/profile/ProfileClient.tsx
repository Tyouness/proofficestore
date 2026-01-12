'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface PasswordStrength {
  hasMinLen: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  score: number;
  label: string;
  colorClass: string;
}

function evaluatePassword(password: string): PasswordStrength {
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':",.<>\/\?\\|]/.test(password);

  const score = [hasMinLen, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  let label = 'Faible';
  let colorClass = 'bg-red-500';

  if (score >= 3) {
    label = 'Fort';
    colorClass = 'bg-green-500';
  } else if (score >= 2) {
    label = 'Moyen';
    colorClass = 'bg-orange-500';
  }

  return { hasMinLen, hasUpper, hasDigit, hasSpecial, score, label, colorClass };
}

export default function ProfileClient({
  userId,
  userEmail,
  initialFullName,
}: {
  userId: string;
  userEmail: string;
  initialFullName: string;
}) {
  // Section Identité
  const [fullName, setFullName] = useState(initialFullName);
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [identityMessage, setIdentityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Section Sécurité
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const passwordStrength = evaluatePassword(newPassword);

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingIdentity(true);
    setIdentityMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setIdentityMessage({ type: 'success', text: 'Profil mis à jour.' });
    } catch (error: any) {
      setIdentityMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoadingIdentity(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSecurity(true);
    setSecurityMessage(null);

    // Validation finale
    if (!passwordStrength.hasMinLen) {
      setSecurityMessage({ type: 'error', text: '8 caractères minimum' });
      setLoadingSecurity(false);
      return;
    }
    if (!passwordStrength.hasUpper) {
      setSecurityMessage({ type: 'error', text: 'Ajoute une majuscule' });
      setLoadingSecurity(false);
      return;
    }
    if (!passwordStrength.hasDigit) {
      setSecurityMessage({ type: 'error', text: 'Ajoute un chiffre' });
      setLoadingSecurity(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      setLoadingSecurity(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage({ type: 'success', text: 'Mot de passe mis à jour.' });
    } catch (error: any) {
      setSecurityMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du mot de passe' });
    } finally {
      setLoadingSecurity(false);
    }
  };

  const isPasswordValid = passwordStrength.hasMinLen && passwordStrength.hasUpper && passwordStrength.hasDigit && newPassword === confirmPassword && newPassword.length > 0;

  return (
    <div className="space-y-6">
      {/* Section Identité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Identité</h2>
        <form onSubmit={handleIdentitySubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={userEmail}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom complet"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {identityMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                identityMessage.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {identityMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingIdentity}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingIdentity ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Section Sécurité */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité</h2>
        <form onSubmit={handleSecuritySubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Entrez votre nouveau mot de passe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {newPassword && (
            <>
              {/* Barre de force */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Force du mot de passe</span>
                  <span
                    className={`text-sm font-medium ${
                      passwordStrength.score >= 3
                        ? 'text-green-600'
                        : passwordStrength.score >= 2
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                    aria-live="polite"
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.colorClass}`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${passwordStrength.hasMinLen ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {passwordStrength.hasMinLen ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  8+ caractères
                </div>
                <div className={`flex items-center ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {passwordStrength.hasUpper ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  1 majuscule
                </div>
                <div className={`flex items-center ${passwordStrength.hasDigit ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {passwordStrength.hasDigit ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  1 chiffre
                </div>
                <div className={`flex items-center ${passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {passwordStrength.hasSpecial ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  1 caractère spécial (recommandé)
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {securityMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                securityMessage.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {securityMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loadingSecurity || !isPasswordValid}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingSecurity ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
