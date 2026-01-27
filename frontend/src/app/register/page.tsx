'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { evaluatePassword, isPasswordValid } from '@/lib/passwordStrength';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // Évaluation de la force du mot de passe
  const passwordStrength = evaluatePassword(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation stricte du mot de passe
    if (!isPasswordValid(password)) {
      setError('Le mot de passe doit contenir au minimum 8 caractères, 1 majuscule et 1 chiffre');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // ✅ SAFE: Appel API signup server-side (ANON_KEY, pas service_role)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || 'Une erreur est survenue lors de la création du compte');
        setLoading(false);
        return;
      }

      // Succès: compte créé + emails envoyés (avec idempotence DB)
      setSuccess(true);
      setNeedsConfirmation(result.needsEmailConfirmation || false);

      // Rediriger vers login après 2s
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {needsConfirmation ? 'Inscription réussie !' : 'Compte créé avec succès !'}
            </h2>
            <p className="text-gray-600 mb-6">
              {needsConfirmation
                ? 'Vérifiez votre boîte email pour confirmer votre compte, puis connectez-vous.'
                : 'Votre compte est activé. Vous pouvez maintenant vous connecter.'}
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
            <p className="text-gray-600">
              Rejoignez AllKeyMasters
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="votre@email.com"
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
                disabled={loading}
              />

              {/* Jauge de force du mot de passe */}
              {password && (
                <div className="mt-3 space-y-2">
                  {/* Barre de progression */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.barClass}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold min-w-[60px] text-right"
                      aria-live="polite"
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Checklist des critères */}
                  <div className="space-y-1 text-xs">
                    <div className={passwordStrength.hasMinLen ? 'text-green-600' : 'text-gray-500'}>
                      {passwordStrength.hasMinLen ? '✓' : '✗'} Au moins 8 caractères
                    </div>
                    <div className={passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-500'}>
                      {passwordStrength.hasUpper ? '✓' : '✗'} Au moins 1 majuscule
                    </div>
                    <div className={passwordStrength.hasDigit ? 'text-green-600' : 'text-gray-500'}>
                      {passwordStrength.hasDigit ? '✓' : '✗'} Au moins 1 chiffre
                    </div>
                    <div className={passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-400'}>
                      {passwordStrength.hasSpecial ? '✓' : '○'} Au moins 1 caractère spécial (recommandé)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid(password) || password !== confirmPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>

          {/* Retour accueil */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-500 text-sm hover:text-gray-700">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
