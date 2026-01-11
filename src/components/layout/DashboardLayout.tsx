'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/expenses', label: 'Daily Expenses', icon: '💸' },
    { href: '/monthly-summary', label: 'Monthly Summary', icon: '📅' },
    { href: '/category-budget', label: 'Category Budget', icon: '📈' },
    { href: '/analytics', label: 'Analytics', icon: '📉' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside
          className={`bg-gray-900 text-white transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } flex flex-col`}
        >
          <div className="p-6 flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">Budget</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-gray-800 p-2 rounded"
            >
              ☰
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            {sidebarOpen && <p className="text-sm text-gray-400 mb-3">{user?.email}</p>}
            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
            >
              {sidebarOpen ? 'Logout' : '🚪'}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar - Mobile */}
        {isMobile && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Budget Tracker</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-2xl"
            >
              ☰
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 md:p-8">{children}</div>

        {/* Mobile Sidebar */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}>
            <div className="bg-gray-900 text-white w-64 h-full p-6" onClick={(e) => e.stopPropagation()}>
              <h1 className="text-xl font-bold mb-8">Budget</h1>
              <nav className="space-y-2 mb-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
