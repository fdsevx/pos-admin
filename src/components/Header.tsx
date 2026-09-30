'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Plus,
  ChevronDown,
  Store,
  Calendar,
  Sparkles,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { OutletFilter } from '@/types';
import { removeAuthToken } from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    outletFilter,
    setOutletFilter,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    setIsMobileMenuOpen,
    outlets,
    userProfile,
  } = useOutlet();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 sm:px-8">
      {/* Left Area: Mobile hamburger & Greeting */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* User Greeting with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <span className="font-bold text-slate-800 text-sm sm:text-base">
              Halo, {userProfile?.display_name || userProfile?.username || 'Super Admin'}!
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{userProfile?.display_name || 'Administrator'}</p>
                <p className="text-[11px] text-slate-400 font-mono capitalize">Role: {userProfile?.role || 'super_admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors mt-1"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Pill */}
        <button
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
          title="Tambah Transaksi Cepat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right Area: Filters & Action buttons */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Outlet Selector Dropdown */}
        <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 gap-2">
          <Store className="w-4 h-4 text-teal-600" />
          <span className="text-xs text-slate-400 font-medium hidden md:inline">
            Outlet:
          </span>
          <select
            value={outletFilter}
            onChange={(e) => setOutletFilter(e.target.value as OutletFilter)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Outlet</option>
            {outlets?.map(outlet => (
              <option key={outlet.id} value={outlet.slug}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>

        {/* Month & Year Filter */}
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>
    </header>
  );
}
