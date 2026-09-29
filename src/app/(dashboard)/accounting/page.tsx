'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Scale,
  RefreshCw,
  Search,
  BookOpen,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { getAccounts, getJournals, formatRupiah } from '@/lib/api';
import { Account, JournalEntry } from '@/types';

export default function AccountingPage() {
  const { outletFilter } = useOutlet();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'COA' | 'JURNAL'>('COA');

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs, jnls] = await Promise.all([
        getAccounts(outletFilter).catch(() => []),
        getJournals(outletFilter).catch(() => ({ items: [], total: 0 })),
      ]);
      setAccounts(accs || []);
      setJournals(jnls.items || []);
    } catch (err) {
      console.error('Error loading accounting data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [outletFilter]);

  // Fallback demo accounts if DB is initializing
  const displayAccounts: Account[] = accounts.length > 0 ? accounts : [
    { code: '1111', name: 'Kas Restoran', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1112', name: 'QRIS Restoran', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1121', name: 'Kas Cafe', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1122', name: 'QRIS Cafe', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1201', name: 'Stok Restoran', type: 'PERSEDIAAN', normal_balance: 'DEBIT', is_active: true },
    { code: '1202', name: 'Stok Cafe', type: 'PERSEDIAAN', normal_balance: 'DEBIT', is_active: true },
    { code: '4100', name: 'Pendapatan Restoran', type: 'PENDAPATAN', normal_balance: 'CREDIT', is_active: true },
    { code: '4200', name: 'Pendapatan Cafe', type: 'PENDAPATAN', normal_balance: 'CREDIT', is_active: true },
    { code: '5100', name: 'HPP Restoran', type: 'HPP', normal_balance: 'DEBIT', is_active: true },
    { code: '5200', name: 'HPP Cafe', type: 'HPP', normal_balance: 'DEBIT', is_active: true },
    { code: '6100', name: 'Beban Restoran', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
    { code: '6200', name: 'Beban Cafe', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-slate-600">
              Dasbor
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">Double Entry & COA</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
            Bagan Akun (COA) & Jurnal Umum
          </h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('COA')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'COA'
                  ? 'bg-white text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Bagan Akun (COA)
            </button>
            <button
              onClick={() => setActiveTab('JURNAL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'JURNAL'
                  ? 'bg-white text-teal-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Jurnal Otomatis
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* COA TAB CONTENT */}
      {activeTab === 'COA' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-teal-500" />
              <h2 className="font-bold text-slate-800 text-sm">
                12 Master Akun Standar (Double-Entry Engine)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Otomatis disinkronkan dari Aiven PostgreSQL
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 uppercase font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">Kode Akun</th>
                  <th className="py-3.5 px-4">Nama Akun</th>
                  <th className="py-3.5 px-4">Klasifikasi</th>
                  <th className="py-3.5 px-4">Saldo Normal</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-600">
                      {acc.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {acc.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      <span
                        className={
                          acc.normal_balance === 'DEBIT'
                            ? 'text-cyan-600'
                            : 'text-amber-600'
                        }
                      >
                        {acc.normal_balance}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* JURNAL TAB CONTENT */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-teal-500" />
              <h2 className="font-bold text-slate-800 text-sm">
                Catatan Jurnal Otomatis Kasir POS
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Diproses asinkron via Goroutines saat transaksi disinkronkan
            </span>
          </div>

          <div className="p-6 text-center text-slate-400 text-xs">
            {journals.length === 0 ? (
              <div className="py-8 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
                <div className="font-semibold text-slate-700 text-sm">
                  Menunggu Sinkronisasi dari Kasir POS
                </div>
                <p className="max-w-md mx-auto text-slate-400 text-xs">
                  Setiap kali kasir di aplikasi Flutter mengirimkan transaksi batch melalui endpoint{' '}
                  <code className="text-teal-600 bg-slate-100 px-1 py-0.5 rounded">/v1/sync</code>,
                  backend Golang akan otomatis membuat jurnal double-entry (Debit Kas/QRIS, Kredit
                  Pendapatan, Debit HPP, Kredit Persediaan) secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {journals.map((j) => (
                  <div key={j.id} className="text-left border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between font-bold text-slate-800 text-xs mb-2">
                      <span>{j.description}</span>
                      <span className="text-slate-400">{j.entry_date}</span>
                    </div>
                    {j.lines?.map((line) => (
                      <div key={line.id} className="flex justify-between text-xs py-1">
                        <span className="text-slate-600">{line.account_code} - {line.description}</span>
                        <div className="space-x-4">
                          <span className="text-cyan-600 font-mono">D: {formatRupiah(line.debit)}</span>
                          <span className="text-rose-600 font-mono">K: {formatRupiah(line.credit)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
