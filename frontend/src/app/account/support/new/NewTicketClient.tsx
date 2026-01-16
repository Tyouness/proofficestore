'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { stripHtml } from '@/lib/sanitize';

interface Order {
  id: string;
  reference: string;
  created_at: string;
}

interface NewTicketClientProps {
  orders: Order[];
  userId: string;
}

export default function NewTicketClient({ orders, userId }: NewTicketClientProps) {
  const router = useRouter();
  const [category, setCategory] = useState<'question' | 'claim'>('question');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const validateForm = (): boolean => {
    if (category === 'claim' && !selectedOrderId) {
      setError('Veuillez sélectionner une commande');
      return false;
    }

    if (subject.length < 3 || subject.length > 120) {
      setError('Le sujet doit contenir entre 3 et 120 caractères');
      return false;
    }

    if (message.length < 10 || message.length > 2000) {
      setError('Le message doit contenir entre 10 et 2000 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer le ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          order_id: category === 'claim' ? selectedOrderId : null,
          category: category,
          subject: stripHtml(subject.trim()), // XSS protection
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) {
        throw new Error('Échec de la création du ticket');
      }

      // 2. Créer le premier message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: userId,
          sender_role: 'user',
          content: stripHtml(message.trim()), // XSS protection
        });

      if (messageError) {
        throw new Error('Échec de l\'envoi du message');
      }

      // 3. Rediriger vers le ticket créé
      router.push(`/account/support/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/account/support"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Retour au support
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créer un ticket de support
          </h1>
          <p className="text-gray-600">
            Décrivez votre problème et notre équipe vous répondra dans les plus brefs délais.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélecteur de type de ticket */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Type de demande <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setCategory('question');
                  setSelectedOrderId('');
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  category === 'question'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      category === 'question'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}
                  >
                    {category === 'question' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Question générale</div>
                    <div className="text-sm text-gray-600">Information ou aide générale</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategory('claim')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  category === 'claim'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      category === 'claim'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}
                  >
                    {category === 'claim' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Problème avec une commande</div>
                    <div className="text-sm text-gray-600">Réclamation ou incident</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Dropdown commande (conditionnel) */}
          {category === 'claim' && (
            <div>
              <label
                htmlFor="order"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Commande concernée <span className="text-red-500">*</span>
              </label>
              {orders.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Vous n'avez aucune commande payée. Pour une réclamation, veuillez d'abord effectuer une commande ou choisir "Question générale".
                  </p>
                </div>
              ) : (
                <>
                  <select
                    id="order"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez une commande</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.reference} — {formatDate(order.created_at)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    Seules vos commandes payées sont affichées
                  </p>
                </>
              )}
            </div>
          )}

          {/* Champ Sujet */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Sujet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              required
              minLength={3}
              maxLength={120}
              placeholder="Ex: Problème d'activation de licence"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-gray-500">
              {subject.length}/120 caractères (minimum 3)
            </p>
          </div>

          {/* Champ Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              required
              minLength={10}
              maxLength={2000}
              rows={8}
              placeholder="Décrivez votre problème en détail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-2 text-sm text-gray-500">
              {message.length}/2000 caractères (minimum 10)
            </p>
          </div>

          {/* Bouton submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (category === 'claim' && !selectedOrderId) ||
                subject.length < 3 ||
                subject.length > 120 ||
                message.length < 10 ||
                message.length > 2000
              }
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Création en cours...
                </span>
              ) : (
                'Créer le ticket'
              )}
            </button>
          </div>
        </form>

        {/* Info sécurité */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-blue-600 text-xl mr-3">💡</span>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Conseils pour un traitement rapide :</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Décrivez précisément votre problème</li>
                <li>Incluez les messages d'erreur si applicable</li>
                <li>Mentionnez les étapes déjà effectuées</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
