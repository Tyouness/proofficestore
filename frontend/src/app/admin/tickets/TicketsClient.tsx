'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
  id: string;
  user_id: string;
  order_id?: string | null;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  created_at: string;
  user_email?: string | null;
  order_reference?: string | null;
  admin_unread_count?: number;
}

export default function TicketsClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCloseTicket = async (ticketId: string) => {
    setLoading(ticketId);

    try {
      const response = await fetch('/api/admin/tickets/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      if (response.ok) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: 'closed' as const } : t))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la fermeture du ticket');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      alert('Erreur réseau');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Aucun ticket trouvé</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                  {ticket.admin_unread_count && ticket.admin_unread_count > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {ticket.admin_unread_count}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      ticket.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ticket.status === 'open' ? '● Ouvert' : '✓ Fermé'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {ticket.user_email || `Client: ${ticket.user_id.slice(0, 6)}...${ticket.user_id.slice(-4)}`}
                  {ticket.order_reference && ` • Commande: ${ticket.order_reference}`}
                  {' • '}
                  {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-gray-700 line-clamp-2">{ticket.message}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Ticket #{ticket.id.slice(0, 8)}
              </div>
              <div className="flex gap-2">
                {ticket.status === 'open' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCloseTicket(ticket.id);
                    }}
                    disabled={loading === ticket.id}
                    className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading === ticket.id ? 'Fermeture...' : 'Fermer'}
                  </button>
                )}
                <Link
                  href={`/admin/tickets/${ticket.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Répondre →
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
