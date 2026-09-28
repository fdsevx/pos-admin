'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  Scale,
  Users,
  Settings,
  ChevronRight,
  X,
  CreditCard,
  Building,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutlet();

  const menuItems = [
    { label: 'Dasbor', href: '/', icon: LayoutDashboard },
    { label: 'Stok Produk', href: '/inventory', icon: Package },
    { label: 'Pengeluaran & Export', href: '/expenses', icon: FileSpreadsheet },
    { label: 'Double Entry', href: '/accounting', icon: Scale },
    { label: 'Kasir & Staf', href: '/users', icon: Users, hasSub: true },
    { label: 'Pelanggan', href: '#', icon: Users },
    { label: 'Perbankan', href: '#', icon: CreditCard, hasSub: true },
    { label: 'Target', href: '#', icon: Target },
    { label: 'Pengaturan', href: '#', icon: Settings },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
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
            {/* Kolabo Teal Logo Mark */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              K
            </div>
            <div>
              <div className="font-extrabold text-slate-800 text-lg tracking-tight">
                Kolabo
              </div>
              <div className="text-[10px] text-slate-400 -mt-1 font-medium">
                By Langit POS
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

                  {item.hasSub && (
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-400'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs">
              <div className="font-semibold text-slate-700">API Terhubung</div>
              <div className="text-slate-400 text-[10px] truncate max-w-[150px]">
                posbackend.b4a.run
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
