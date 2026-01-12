'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AccountSidebarProps {
  userEmail: string;
  isMobile?: boolean;
}

export default function AccountSidebar({ userEmail, isMobile = false }: AccountSidebarProps) {
  const pathname = usePathname();

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
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors
                ${
                  item.isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
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
              flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
              ${
                item.isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 border border-transparent'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            🚪 Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
