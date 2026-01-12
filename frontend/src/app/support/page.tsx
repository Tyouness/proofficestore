import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default async function SupportPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-hzptzuljmexfflefxwqy-auth-token');

  let user = null;
  let recentTickets = null;

  // Vérifier si l'utilisateur est connecté
  if (authCookie) {
    try {
      const session = JSON.parse(authCookie.value);
      
      if (session?.access_token) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            },
          }
        );

        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          user = authUser;

          // Récupérer les 3 derniers tickets
          const { data: tickets } = await supabase
            .from('support_tickets')
            .select('id, subject, status, created_at')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .limit(3);

          recentTickets = tickets;
        }
      }
    } catch (error) {
      // Silencieux - l'utilisateur verra l'interface non connectée
    }
  }

  // ──────────────────────────────────────────────
  // UI pour utilisateur NON connecté
  // ──────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support</h1>
            <p className="text-lg text-gray-600">
              Besoin d'aide ? Notre équipe est là pour vous.
            </p>
          </div>

          {/* Carte principale */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Connexion requise
              </h2>
              <p className="text-gray-600 mb-6">
                Pour faire une réclamation et suivre vos tickets, vous devez être connecté(e).
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="flex-1 bg-blue-600 text-white text-center py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="flex-1 bg-white text-gray-900 text-center py-4 px-6 rounded-xl font-semibold border-2 border-gray-200 hover:border-blue-400 hover:bg-gray-50 transition-all"
              >
                Créer un compte
              </Link>
            </div>
          </div>

          {/* Section FAQ publique */}
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Comment recevoir ma clé de licence ?
                </h4>
                <p className="text-sm text-gray-600">
                  Votre clé est envoyée automatiquement par email après le paiement. Vérifiez vos spams si vous ne la recevez pas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Problème d'activation ?
                </h4>
                <p className="text-sm text-gray-600">
                  Essayez avec un nouveau compte Microsoft ou utilisez l'activation par téléphone. Contactez-nous si le problème persiste.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Délai de réponse ?
                </h4>
                <p className="text-sm text-gray-600">
                  Notre équipe répond généralement sous 24h ouvrées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // UI pour utilisateur CONNECTÉ
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Support</h1>
          <p className="text-gray-600">
            Bienvenue {user.email}
          </p>
        </div>

        {/* Accès rapide */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Créer un ticket */}
          <Link
            href="/account/support"
            className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Créer un ticket</h3>
            <p className="text-blue-100 text-sm">
              Ouvrez un nouveau ticket de support
            </p>
          </Link>

          {/* Voir tous les tickets */}
          <Link
            href="/account/support"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mes tickets</h3>
            <p className="text-gray-600 text-sm">
              Voir tous mes tickets de support
            </p>
          </Link>
        </div>

        {/* Tickets récents */}
        {recentTickets && recentTickets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tickets récents
            </h2>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/account/support/${ticket.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ticket.status === 'open' ? '● Ouvert' : '✓ Fermé'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Message si aucun ticket */}
        {(!recentTickets || recentTickets.length === 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun ticket pour le moment
            </h3>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas encore créé de ticket de support
            </p>
            <Link
              href="/account/support"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Créer mon premier ticket
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
