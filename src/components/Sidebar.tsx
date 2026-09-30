'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  Scale,
  Users,
  Settings,
  X,
  FileSpreadsheet,
  LogOut,
  ShoppingCart,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { removeAuthToken } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutlet();

  const menuItems = [
    { label: 'Dasbor & Laporan', href: '/', icon: LayoutDashboard },
    { label: 'Katalog & Stok', href: '/inventory', icon: Package },
    { label: 'Transaksi Kasir', href: '/transactions', icon: ShoppingCart },
    { label: 'Pelanggan (CRM)', href: '/customers', icon: Users },
    { label: 'Pembelian & Biaya', href: '/expenses', icon: FileSpreadsheet },
    { label: 'Double Entry', href: '/accounting', icon: Scale },
    { label: 'Kasir & Staf', href: '/users', icon: ShieldCheck },
    { label: 'Unit Usaha', href: '/outlets', icon: Store },
    { label: 'Pengaturan Struk', href: '/settings', icon: Settings },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* POS BWX Teal Logo Mark */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              P
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-lg tracking-tight">
                POS BWX
              </div>
              <div className="text-[10px] text-teal-600 -mt-1 font-semibold uppercase tracking-wider">
                by danz
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 pr-3 scrollbar-thin">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center justify-between px-5 py-3 text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-teal-500 text-white rounded-r-2xl shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-r-xl'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs">
              <div className="font-semibold text-slate-700">API Terhubung</div>
              <div className="text-slate-400 text-[10px] truncate max-w-[150px]">
                pos-backend.fdsevx.workers.dev
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors text-sm font-semibold shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
