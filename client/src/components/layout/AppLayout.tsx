import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasNavAccess } from '../../lib/permissions';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', path: '/customers', icon: Users },
  { key: 'products', label: 'Inventory', path: '/products', icon: Package },
  { key: 'challans', label: 'Challans', path: '/challans', icon: FileText },
];

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: "Overview of your business operations" },
  '/customers': { title: 'Customers', subtitle: 'Manage customer relationships and follow-ups' },
  '/products': { title: 'Inventory', subtitle: 'Monitor products, stock levels and warehouse movement' },
  '/challans': { title: 'Sales Challans', subtitle: 'Track outgoing orders and inventory commitments' },
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get page info from current path (handle nested routes)
  const basePath = '/' + (location.pathname.split('/')[1] || 'dashboard');
  const currentPage = pageInfo[basePath] || { title: 'FundsRoom', subtitle: '' };

  const filteredNav = navItems.filter((item) => hasNavAccess(user?.role, item.key));

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="min-h-screen flex relative">
      {/* Ambient background */}
      <div className="bg-ambient" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--color-accent-burgundy)' }}>
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary tracking-tight">
                FundsRoom
              </h1>
              <p className="text-[10px] text-text-muted font-medium tracking-wider uppercase">
                ERP Operations
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Workspace
          </p>
          {filteredNav.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border-base">
          <div className="flex items-center gap-3 mb-3">
            <div className="avatar w-9 h-9">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-ghost w-full justify-center text-xs gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Topbar */}
        <header className="topbar sticky top-0 z-30 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden btn-ghost p-2"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  {currentPage.title}
                </h2>
                {currentPage.subtitle && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {currentPage.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop user info */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-text-primary">
                  {user?.name}
                </p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                  {user?.role}
                </p>
              </div>
              <div className="avatar w-9 h-9">{initials}</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6">
          <div key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
