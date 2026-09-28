'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  RotateCcw,
  Calendar,
  Wallet,
  Building,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { formatRupiah, getExportUrl, API_BASE_URL } from '@/lib/api';

export default function ExpensesAndReportsPage() {
  const { outletFilter, selectedMonth, selectedYear } = useOutlet();

  // Filter States (Image 3 Style)
  const [startMonth, setStartMonth] = useState<string>('2026-09');
  const [endMonth, setEndMonth] = useState<string>('2026-09');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');

  // Modal State for New Expense
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Operasional',
    description: '',
    amount: '',
    outlet_type: 'RESTORAN',
    expense_date: new Date().toISOString().slice(0, 10),
  });

  // Sample static expense and journal entries matching Image 3 structure
  const [expensesList, setExpensesList] = useState([
    {
      id: '1',
      date: '28-09-2026',
      account: 'Cash Restoran (1111)',
      type: 'Pengeluaran',
      category: 'Operasional',
      description: 'Beli es batu kristal 5 karung',
      amount: 75000,
      outlet: 'RESTORAN',
    },
    {
      id: '2',
      date: '28-09-2026',
      account: 'Cash Cafe (1121)',
      type: 'Pengeluaran',
      category: 'Bahan Baku',
      description: 'Susu UHT Fresh Milk 10 liter',
      amount: 195000,
      outlet: 'CAFE',
    },
    {
      id: '3',
      date: '27-09-2026',
      account: 'QRIS Mandiri (1112)',
      type: 'Pengeluaran',
      category: 'Utilitas',
      description: 'Token listrik PLN Restoran & Cafe',
      amount: 500000,
      outlet: 'RESTORAN',
    },
    {
      id: '4',
      date: '26-09-2026',
      account: 'Cash Cafe (1121)',
      type: 'Pengeluaran',
      category: 'Perlengkapan',
      description: 'Cup plastik 16oz + Sedotan + Tissue',
      amount: 120000,
      outlet: 'CAFE',
    },
  ]);

  const totalExpenseSum = expensesList.reduce((acc, curr) => acc + curr.amount, 0);

  // Form submit handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now().toString(),
      date: expenseForm.expense_date,
      account: expenseForm.outlet_type === 'RESTORAN' ? 'Cash Restoran (1111)' : 'Cash Cafe (1121)',
      type: 'Pengeluaran',
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount) || 0,
      outlet: expenseForm.outlet_type,
    };

    setExpensesList([newEntry, ...expensesList]);
    setIsExpenseModalOpen(false);
    setExpenseForm({
      category: 'Operasional',
      description: '',
      amount: '',
      outlet_type: 'RESTORAN',
      expense_date: new Date().toISOString().slice(0, 10),
    });
  };

  // Direct Server-Stream Export Download Handlers (Poin 8)
  const handleDownloadPDF = () => {
    const url = getExportUrl('pdf', selectedMonth, selectedYear, outletFilter);
    window.open(url, '_blank');
  };

  const handleDownloadExcel = () => {
    const url = getExportUrl('excel', selectedMonth, selectedYear, outletFilter);
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb (Kolabo Image 3 Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-slate-600">
              Dasbor
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Laporan</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">Ringkasan Transaksi & Pengeluaran</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
            Ringkasan Transaksi & Pengeluaran
          </h1>
        </div>

        {/* Action Export Buttons (Direct Stream dari Server Backend Golang) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
            title="Download PDF langsung dari backend Go"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-500 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-cyan-600 transition-colors shadow-sm"
            title="Export Excel langsung dari backend Go (Excelize)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-500 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors shadow-sm"
            title="Catat Pengeluaran Harian"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR CARD (Kolabo Image 3 Style) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Bulan Mulai
            </label>
            <input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Bulan Akhir
            </label>
            <input
              type="month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Akun / Sumber Dana
            </label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-teal-500 font-medium cursor-pointer"
            >
              <option value="ALL">Semua Akun</option>
              <option value="1111">Kas Restoran (1111)</option>
              <option value="1112">QRIS Restoran (1112)</option>
              <option value="1121">Kas Cafe (1121)</option>
              <option value="1122">QRIS Cafe (1122)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Kategori Beban
            </label>
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-teal-500 font-medium cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                <option value="Operasional">Operasional</option>
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Utilitas">Utilitas (Listrik/Air/Gas)</option>
                <option value="Perlengkapan">Perlengkapan</option>
              </select>

              <button
                className="p-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors shrink-0"
                title="Cari"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterAccount('ALL');
                }}
                className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shrink-0"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY INFO CARDS (Kolabo Image 3 Middle Section) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Laporan Info */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Laporan :</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">
            Ringkasan Pengeluaran & Biaya
          </div>
        </div>

        {/* Durasi Info */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Durasi Periode :</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">
            September 2026
          </div>
        </div>

        {/* Saldo Bank Mandiri */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Bank Mandiri / QRIS</div>
            <div className="text-base font-bold text-slate-800 mt-0.5">
              Rp3.450.000
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] text-rose-600 font-semibold">Total Pengeluaran</div>
            <div className="text-base font-extrabold text-rose-700 mt-0.5">
              {formatRupiah(totalExpenseSum)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* TABLE DATA (Kolabo Image 3 Style) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 text-xs">
          <div className="text-slate-500">
            Menampilkan <strong className="text-slate-800">{expensesList.length}</strong> catatan pengeluaran
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Akun Sumber Dana</th>
                <th className="py-3.5 px-4">Outlet</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Deskripsi</th>
                <th className="py-3.5 px-4 text-right">Jumlah Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expensesList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-500">
                    {item.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {item.account}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.outlet === 'RESTORAN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.outlet}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {item.description}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-600 text-right">
                    - {formatRupiah(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM: PENGELUARAN HARIAN (Poin 8) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                Catat Pengeluaran Operasional
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Outlet Terkait *
                  </label>
                  <select
                    value={expenseForm.outlet_type}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, outlet_type: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="RESTORAN">Restoran</option>
                    <option value="CAFE">Cafe</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pengeluaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, expense_date: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Pengeluaran *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                >
                  <option value="Operasional">Operasional (Es batu, Gas, Plastik, Tissue)</option>
                  <option value="Utilitas">Utilitas (Listrik, Air PAM, WiFi)</option>
                  <option value="Bahan Baku">Bahan Baku Mendesak</option>
                  <option value="Gaji / Upah Harian">Gaji / Upah Harian Kasir</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pengeluaran (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 50000"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-bold text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Pembelian *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Beli es kristal 2 karung untuk operasional siang..."
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200/60">
                💡 Pengeluaran ini akan langsung dihitung di server dan otomatis memotong
                <strong> Laba Bersih</strong> outlet terkait di laporan bulanan.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
