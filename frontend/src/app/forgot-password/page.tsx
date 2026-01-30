'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email invalide');
      setLoading(false);
      return;
    }

    try {
      // Vérifier si l'utilisateur existe d'abord
      const { data: userCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', email) // On cherche dans profiles mais on peut pas query par email ici
        .maybeSingle();

      // Envoyer le lien de réinitialisation via Supabase Auth
      // Supabase vérifie automatiquement si l'email existe
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        console.error('[FORGOT_PASSWORD] Error:', error.message);
        
        // Ne jamais révéler si l'email existe ou non (sécurité)
        // On affiche toujours le même message de succès
      }

      // Toujours afficher le message de succès (même si email inexistant)
      // Sécurité: ne pas révéler si un compte existe
      setSuccess(true);
      toast.success('Email envoyé !');
    } catch (error: any) {
      console.error('[FORGOT_PASSWORD] Exception:', error);
      // Même en cas d'erreur, on affiche le message de succès
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h1>
            <p className="text-gray-600">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Vérifiez votre boîte mail</strong>
              <br />
              Le lien de réinitialisation est valide pendant 1 heure.
              <br />
              Pensez à vérifier vos spams.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la connexion
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full text-center border border-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Envoyer à une autre adresse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h1>
          <p className="text-gray-600">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
