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
  AlertCircle,
  Building,
  Plus,
  X,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import {
  getCOA,
  createCOA,
  createManualJournal,
  getGeneralLedger,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  formatRupiah,
} from '@/lib/api';
import { Account } from '@/types';

export default function AccountingPage() {
  const { outletFilter, selectedMonth, selectedYear } = useOutlet();

  const [activeTab, setActiveTab] = useState<
    'COA' | 'LEDGER' | 'TRIAL_BALANCE' | 'INCOME_STATEMENT' | 'BALANCE_SHEET'
  >('COA');

  const [coa, setCoa] = useState<Account[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any[]>([]);
  const [incomeStatement, setIncomeStatement] = useState<any | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamically compute correct dates based on the selected month & year
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const defaultFirstDay = `${monthStr}-01`;
  const defaultLastDay = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState<string>(defaultFirstDay);
  const [endDate, setEndDate] = useState<string>(defaultLastDay);

  // Sync date inputs when selectedMonth or selectedYear changes
  useEffect(() => {
    const dInM = new Date(selectedYear, selectedMonth, 0).getDate();
    const mStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    setStartDate(`${mStr}-01`);
    setEndDate(`${mStr}-${String(dInM).padStart(2, '0')}`);
  }, [selectedYear, selectedMonth]);

  // COA Modal
  const [isCoaModalOpen, setIsCoaModalOpen] = useState<boolean>(false);
  const [coaForm, setCoaForm] = useState({
    code: '',
    name: '',
    type: 'asset',
    normal_balance: 'DEBIT',
    initial_balance: '0',
  });

  // Manual Journal Modal
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);
  const [journalForm, setJournalForm] = useState({
    description: '',
    entry_date: new Date().toISOString().slice(0, 10),
    lines: [
      { account_id: '', debit: '0', credit: '0' },
      { account_id: '', debit: '0', credit: '0' },
    ],
  });

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    if (outletFilter === 'ALL') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      if (activeTab === 'COA') {
        const data = await getCOA(outletFilter);
        setCoa(data || []);
      } else if (activeTab === 'LEDGER') {
        const data = await getGeneralLedger(outletFilter, startDate, endDate);
        setLedger(data?.data || data || []);
      } else if (activeTab === 'TRIAL_BALANCE') {
        const data = await getTrialBalance(outletFilter, startDate, endDate);
        setTrialBalance(data?.data || data || []);
      } else if (activeTab === 'INCOME_STATEMENT') {
        const data = await getIncomeStatement(outletFilter, startDate, endDate);
        setIncomeStatement(data?.data || data);
      } else if (activeTab === 'BALANCE_SHEET') {
        const data = await getBalanceSheet(outletFilter, endDate);
        setBalanceSheet(data?.data || data);
      }
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.message || 'Gagal memuat data akuntansi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [outletFilter, activeTab, startDate, endDate]);

  // Handle Create Account COA
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (outletFilter === 'ALL') return;
    setSubmitting(true);
    try {
      await createCOA(outletFilter, {
        code: coaForm.code,
        name: coaForm.name,
        type: coaForm.type,
        normal_balance: coaForm.normal_balance,
        initial_balance: parseFloat(coaForm.initial_balance) || 0,
      });
      setMsg({ type: 'success', text: 'Akun COA berhasil ditambahkan!' });
      setIsCoaModalOpen(false);
      setCoaForm({ code: '', name: '', type: 'asset', normal_balance: 'DEBIT', initial_balance: '0' });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menambahkan akun COA' });
    } finally {
      setSubmitting(false);
    }
  };

  // Fallback demo accounts if DB is empty
  const displayAccounts = coa.length > 0 ? coa : [
    { code: '1110', name: 'Kas Kasir', type: 'asset', normal_balance: 'DEBIT', is_active: true },
    { code: '1120', name: 'Bank & QRIS', type: 'asset', normal_balance: 'DEBIT', is_active: true },
    { code: '1200', name: 'Persediaan Produk', type: 'asset', normal_balance: 'DEBIT', is_active: true },
    { code: '4100', name: 'Pendapatan Penjualan', type: 'revenue', normal_balance: 'CREDIT', is_active: true },
    { code: '5100', name: 'Beban Pokok Penjualan (HPP)', type: 'expense', normal_balance: 'DEBIT', is_active: true },
    { code: '6100', name: 'Beban Operasional Toko', type: 'expense', normal_balance: 'DEBIT', is_active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Sistem Akuntansi Otomatis</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Double-Entry & Laporan Keuangan
          </h1>
          <p className="text-slate-500 text-sm">
            Jurnal otomatis ter-generate dari setiap transaksi penjualan kasir, restok HPP, dan kas keluar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading || outletFilter === 'ALL'}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          {activeTab === 'COA' && (
            <button
              onClick={() => setIsCoaModalOpen(true)}
              disabled={outletFilter === 'ALL'}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun COA</span>
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { key: 'COA', label: 'Bagan Akun (COA)' },
          { key: 'LEDGER', label: 'Buku Besar (Ledger)' },
          { key: 'TRIAL_BALANCE', label: 'Neraca Saldo' },
          { key: 'INCOME_STATEMENT', label: 'Laba Rugi' },
          { key: 'BALANCE_SHEET', label: 'Neraca Keuangan' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all border-b-2 ${
              activeTab === tab.key
                ? 'border-teal-600 text-teal-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filter Bar for Financial Reports */}
      {outletFilter !== 'ALL' && activeTab !== 'COA' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Filter Periode:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Dari:</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Sampai:</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const dInM = new Date(selectedYear, selectedMonth, 0).getDate();
                const mStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
                setStartDate(`${mStr}-01`);
                setEndDate(`${mStr}-${String(dInM).padStart(2, '0')}`);
              }}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
            >
              Reset ke Bulan Ini
            </button>
          </div>
        </div>
      )}

      {outletFilter === 'ALL' ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Pilih Unit Usaha Spesifik
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Pembukuan akuntansi dan neraca saldo berlaku per masing-masing entitas unit usaha. Silakan pilih unit usaha dari dropdown di pojok kanan atas.
          </p>
        </div>
      ) : activeTab === 'COA' ? (
        /* COA View */
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Kode Akun</th>
                  <th className="py-4 px-6">Nama Akun</th>
                  <th className="py-4 px-6">Tipe Akun</th>
                  <th className="py-4 px-6">Saldo Normal</th>
                  <th className="py-4 px-6 text-right">Saldo Awal</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800 text-xs">
                      {acc.code}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-800">{acc.name}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold uppercase">
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600">
                      {acc.normal_balance}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-800 text-xs font-semibold">
                      {formatRupiah(acc.initial_balance || '0')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'LEDGER' ? (
        /* Ledger View */
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Akun</th>
                  <th className="py-4 px-6">Keterangan</th>
                  <th className="py-4 px-6 text-right">Debit</th>
                  <th className="py-4 px-6 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                      <span>Memuat jurnal buku besar...</span>
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Belum ada baris jurnal pada periode bulan ini.
                    </td>
                  </tr>
                ) : (
                  ledger.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 text-xs font-mono text-slate-500">
                        {row.entry_date}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800 text-xs">
                          {row.account_code} - {row.account_name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 text-xs">{row.description}</td>
                      <td className="py-4 px-6 text-right font-mono font-semibold text-slate-800">
                        {parseFloat(row.debit) > 0 ? formatRupiah(row.debit) : '-'}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-semibold text-slate-800">
                        {parseFloat(row.credit) > 0 ? formatRupiah(row.credit) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'TRIAL_BALANCE' ? (
        /* Trial Balance View */
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Kode & Nama Akun</th>
                  <th className="py-4 px-6">Tipe Akun</th>
                  <th className="py-4 px-6 text-right">Total Debit</th>
                  <th className="py-4 px-6 text-right">Total Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                      <span>Memuat neraca saldo...</span>
                    </td>
                  </tr>
                ) : trialBalance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Belum ada pergerakan saldo pada periode ini.
                    </td>
                  </tr>
                ) : (
                  trialBalance.map((tb, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {tb.account_code} - {tb.account_name}
                      </td>
                      <td className="py-4 px-6 uppercase text-xs text-slate-500">{tb.type}</td>
                      <td className="py-4 px-6 text-right font-mono text-slate-800">
                        {formatRupiah(tb.total_debit || '0')}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-800">
                        {formatRupiah(tb.total_credit || '0')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'INCOME_STATEMENT' ? (
        /* Income Statement View */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Laporan Laba Rugi</h3>
            <p className="text-xs text-slate-400">Periode: {startDate} s/d {endDate}</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              <span>Menghitung Laba Rugi...</span>
            </div>
          ) : !incomeStatement ? (
            <div className="py-8 text-center text-slate-400">
              Belum ada data pendapatan dan beban untuk periode ini.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pendapatan */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Pendapatan Operasional
                </h4>
                {incomeStatement.revenues?.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700">{r.account_name}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRupiah(r.net_balance)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t text-teal-600">
                  <span>Total Pendapatan</span>
                  <span>{formatRupiah(incomeStatement.total_revenue || 0)}</span>
                </div>
              </div>

              {/* Beban */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Beban Usaha & HPP
                </h4>
                {incomeStatement.expenses?.map((e: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700">{e.account_name}</span>
                    <span className="font-mono font-semibold text-rose-600">
                      {formatRupiah(e.net_balance)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t text-rose-600">
                  <span>Total Beban Usaha</span>
                  <span>{formatRupiah(incomeStatement.total_expense || 0)}</span>
                </div>
              </div>

              {/* Net Income */}
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center font-bold text-base border border-slate-200">
                <span>LABA BERSIH (NET INCOME)</span>
                <span className="text-teal-600 font-mono text-xl">
                  {formatRupiah(incomeStatement.net_income || 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Balance Sheet View */
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Neraca Keuangan (Balance Sheet)</h3>
            <p className="text-xs text-slate-400">Posisi Keuangan per tanggal {endDate}</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              <span>Menyusun Neraca...</span>
            </div>
          ) : !balanceSheet ? (
            <div className="py-8 text-center text-slate-400">
              Belum ada data neraca untuk periode ini.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Aset (Harta)
                </h4>
                {balanceSheet.assets?.map((a: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700">{a.account_name}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRupiah(a.balance)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t text-slate-900">
                  <span>Total Aset</span>
                  <span>{formatRupiah(balanceSheet.total_assets || 0)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Kewajiban & Ekuitas (Modal)
                </h4>
                {balanceSheet.liabilities?.map((l: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700">{l.account_name}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRupiah(l.balance)}
                    </span>
                  </div>
                ))}
                {balanceSheet.equity?.map((e: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700">{e.account_name}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatRupiah(e.balance)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t text-slate-900">
                  <span>Total Kewajiban & Ekuitas</span>
                  <span>
                    {formatRupiah(
                      (balanceSheet.total_liabilities || 0) + (balanceSheet.total_equity || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add COA Modal */}
      {isCoaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Akun COA Baru</h3>
              <button onClick={() => setIsCoaModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode Akun
                </label>
                <input
                  type="text"
                  required
                  value={coaForm.code}
                  onChange={(e) => setCoaForm({ ...coaForm, code: e.target.value })}
                  placeholder="Contoh: 1113"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Akun
                </label>
                <input
                  type="text"
                  required
                  value={coaForm.name}
                  onChange={(e) => setCoaForm({ ...coaForm, name: e.target.value })}
                  placeholder="Contoh: Rekening BCA Cabang"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipe Akun
                  </label>
                  <select
                    value={coaForm.type}
                    onChange={(e) => setCoaForm({ ...coaForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="asset">Aset</option>
                    <option value="liability">Kewajiban</option>
                    <option value="equity">Ekuitas</option>
                    <option value="revenue">Pendapatan</option>
                    <option value="expense">Beban / HPP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Saldo Normal
                  </label>
                  <select
                    value={coaForm.normal_balance}
                    onChange={(e) => setCoaForm({ ...coaForm, normal_balance: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">KREDIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={coaForm.initial_balance}
                  onChange={(e) => setCoaForm({ ...coaForm, initial_balance: e.target.value })}
                  placeholder="Contoh: 10000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCoaModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
