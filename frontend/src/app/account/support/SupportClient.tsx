'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { stripHtml } from '@/lib/sanitize';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  created_at: string;
  lastMessageSenderRole?: 'user' | 'admin';
}

interface SupportClientProps {
  userId: string;
  userEmail: string;
}

const SUBJECT_OPTIONS = [
  { value: 'Problème clé', label: 'Problème avec ma clé de licence' },
  { value: 'Installation', label: 'Aide à l\'installation' },
  { value: 'Remboursement', label: 'Demande de remboursement' },
  { value: 'Autre', label: 'Autre question' },
];

export default function SupportClient({ userId, userEmail }: SupportClientProps) {
  const [subject, setSubject] = useState('Problème clé');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Charger les tickets existants
  useEffect(() => {
    loadTickets();
  }, [userId]);

  async function loadTickets() {
    setLoadingTickets(true);
    try {
      // Récupérer les tickets avec les messages associés
      const { data: ticketsData, error: fetchError } = await supabase
        .from('support_tickets')
        .select(`
          id,
          user_id,
          subject,
          message,
          status,
          created_at,
          support_messages(id, sender_role, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Traiter les données pour obtenir le dernier message
      const processedTickets = (ticketsData || []).map((ticket: any) => ({
        ...ticket,
        lastMessageSenderRole: ticket.support_messages && ticket.support_messages.length > 0
          ? ticket.support_messages[ticket.support_messages.length - 1].sender_role
          : undefined,
      }));

      setTickets(processedTickets);
    } catch (err: any) {
      // Silencieusement ignorer l'erreur (pas de console.error)
    } finally {
      setLoadingTickets(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!message.trim()) {
      setError('Veuillez écrire un message');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject,
          message: stripHtml(message.trim()), // XSS protection
          status: 'open',
        });

      if (insertError) throw insertError;

      setSuccess('Votre ticket a été créé avec succès. Nous vous répondrons par email.');
      setMessage('');
      
      // Recharger les tickets
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du ticket');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function truncateMessage(msg: string, maxLength = 100) {
    if (msg.length <= maxLength) return msg;
    return msg.substring(0, maxLength) + '...';
  }

  return (
    <>
      {/* En-tête */}
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au compte
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="mt-2 text-gray-600">Besoin d'aide ? Créez un ticket et nous vous répondrons rapidement.</p>
      </div>

      {/* Formulaire de création de ticket */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Créer un nouveau ticket</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sujet */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Sujet
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Décrivez votre problème en détail..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={loading}
            />
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Bouton submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le ticket'}
          </button>
        </form>
      </div>

      {/* Historique des tickets */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mes tickets</h2>

        {loadingTickets ? (
          <p className="text-gray-500 text-center py-8">Chargement...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun ticket pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/account/support/${ticket.id}`}
                className="block"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {ticket.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          ticket.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ticket.status === 'open' ? '● Ouvert' : '✓ Fermé'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3">
                    {truncateMessage(ticket.message)}
                  </p>

                  {/* Badges informatifs */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.created_at)}
                    </p>
                    {ticket.lastMessageSenderRole && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          ticket.lastMessageSenderRole === 'admin'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Dernière réponse :{' '}
                        {ticket.lastMessageSenderRole === 'admin' ? 'Admin' : 'Vous'}
                      </span>
                    )}
                  </div>

                  {/* Bouton d'action */}
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
                    >
                      Voir la discussion →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
