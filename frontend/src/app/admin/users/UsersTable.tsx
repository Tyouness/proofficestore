'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  // Filtrer les utilisateurs par recherche
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFullName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'Non renseigné';
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Voulez-vous vraiment envoyer un lien de réinitialisation à ${userEmail} ?`)) {
      return;
    }

    setResettingPassword(userId);

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'envoi');
      }

      toast.success(result.message || 'Lien de réinitialisation envoyé');
    } catch (error: any) {
      console.error('[RESET PASSWORD] Error:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setResettingPassword(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Barre de recherche */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Rechercher par email, nom, prénom ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Nom complet
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date d'inscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email confirmé
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dernière connexion
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`mailto:${user.email}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {user.email}
                    </a>
                  </td>

                  {/* Nom complet */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={user.first_name || user.last_name ? 'text-gray-900' : 'text-gray-400 italic'}>
                      {getFullName(user)}
                    </span>
                  </td>

                  {/* Date d'inscription */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Email confirmé */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.email_confirmed_at ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Confirmé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        En attente
                      </span>
                    )}
                  </td>

                  {/* Dernière connexion */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(user.last_sign_in_at)}
                  </td>

                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {user.id.slice(0, 8)}...
                    </code>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      disabled={resettingPassword === user.id}
                      className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resettingPassword === user.id ? (
                        <>
                          <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Envoi...
                        </>
                      ) : (
                        <>
                          🔑 Réinitialiser MDP
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer avec statistiques */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Total : <strong className="text-gray-900">{users.length}</strong> utilisateur{users.length > 1 ? 's' : ''}
          </div>
          <div>
            Email confirmé : <strong className="text-gray-900">
              {users.filter(u => u.email_confirmed_at).length}
            </strong> / {users.length}
          </div>
        </div>
      </div>
    </div>
  );
}
