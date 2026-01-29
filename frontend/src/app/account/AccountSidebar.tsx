'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface AccountSidebarProps {
  userEmail: string;
  userId: string;
  isMobile?: boolean;
}

export default function AccountSidebar({ userEmail, userId, isMobile = false }: AccountSidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger le total de messages non lus
  useEffect(() => {
    async function loadUnreadCount() {
      const { data } = await supabase
        .from('support_tickets')
        .select('unread_count')
        .eq('user_id', userId);

      if (data) {
        const total = data.reduce((sum, ticket) => sum + (ticket.unread_count || 0), 0);
        setUnreadCount(total);
      }
    }

    loadUnreadCount();

    // Réaltime pour mettre à jour le compteur
    const channel = supabase
      .channel(`user-tickets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const navItems = [
    {
      href: '/account',
      label: 'Mes commandes & licences',
      icon: '📦',
      isActive: pathname === '/account',
    },
    {
      href: '/account/profile',
      label: 'Profil & sécurité',
      icon: '👤',
      isActive: pathname === '/account/profile',
    },
    {
      href: '/account/support',
      label: 'Support',
      icon: '💬',
      isActive: pathname.startsWith('/account/support'),
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  if (isMobile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Espace client</h2>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors relative
                ${
                  item.isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Espace client</h2>
        <p className="text-sm text-gray-600 truncate" title={userEmail}>
          {userEmail}
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-medium transition-all
              ${
                item.isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
              }
            `}
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </span>
            {item.badge && item.badge > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={async () => {
            console.log('[SIDEBAR LOGOUT] 🚀 Début de la déconnexion');
            try {
              console.log('[SIDEBAR LOGOUT] 📞 Appel de supabase.auth.signOut()...');
              const { error } = await supabase.auth.signOut({ scope: 'local' });
              
              if (error) {
                console.error('[SIDEBAR LOGOUT] ❌ Erreur Supabase signOut:', error);
              } else {
                console.log('[SIDEBAR LOGOUT] ✅ Supabase signOut réussi');
              }
              
              console.log('[SIDEBAR LOGOUT] 🧹 Nettoyage localStorage...');
              localStorage.clear();
              console.log('[SIDEBAR LOGOUT] ✅ localStorage nettoyé');
              
              console.log('[SIDEBAR LOGOUT] 🔄 Redirection vers /...');
              window.location.replace('/');
            } catch (error) {
              console.error('[SIDEBAR LOGOUT] ❌ Exception capturée:', error);
              localStorage.clear();
              window.location.replace('/');
            }
          }}
          className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}
