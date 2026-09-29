'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Download,
  Calendar,
  Wallet,
  ShoppingBag,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  FileText,
  Package,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import {
  getExpenses,
  createExpense,
  getPurchases,
  createPurchase,
  getProducts,
  getExportUrl,
  formatRupiah,
} from '@/lib/api';
import { Expense, Purchase, Product } from '@/types';

export default function ExpensesPage() {
  const { outletFilter, selectedMonth, selectedYear } = useOutlet();

  const [activeTab, setActiveTab] = useState<'expenses' | 'purchases' | 'export'>('expenses');

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState<boolean>(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Operasional',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
  });

  // Purchases State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState<boolean>(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState<boolean>(false);
  const [purchaseForm, setPurchaseForm] = useState({
    receipt_number: '',
    product_id: '',
    quantity: 1,
    unit_cost: '',
    notes: '',
  });

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    if (outletFilter === 'ALL') {
      setExpenses([]);
      setPurchases([]);
      setLoadingExpenses(false);
      setLoadingPurchases(false);
      return;
    }

    setLoadingExpenses(true);
    setLoadingPurchases(true);
    try {
      const [expData, purData, prodData] = await Promise.all([
        getExpenses(outletFilter).catch(() => []),
        getPurchases(outletFilter).catch(() => []),
        getProducts(outletFilter).catch(() => []),
      ]);
      setExpenses(expData || []);
      setPurchases(purData || []);
      setProducts(prodData || []);
      if (prodData && prodData.length > 0 && !purchaseForm.product_id) {
        setPurchaseForm((prev) => ({ ...prev, product_id: prodData[0].id }));
      }
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.message || 'Gagal memuat data' });
    } finally {
      setLoadingExpenses(false);
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [outletFilter]);

  // Create Expense Handler
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (outletFilter === 'ALL') return;

    setSubmitting(true);
    setMsg(null);
    try {
      await createExpense(outletFilter, {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount).toFixed(2),
        expense_date: expenseForm.expense_date,
      });
      setMsg({ type: 'success', text: 'Pengeluaran kas berhasil dicatat & masuk jurnal akuntansi!' });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        category: 'Operasional',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().slice(0, 10),
      });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal mencatat pengeluaran' });
    } finally {
      setSubmitting(false);
    }
  };

  // Create Purchase (Restok) Handler
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (outletFilter === 'ALL') return;

    setSubmitting(true);
    setMsg(null);

    const unitCost = parseFloat(purchaseForm.unit_cost) || 0;
    const qty = Number(purchaseForm.quantity) || 1;
    const totalAmount = unitCost * qty;

    const payload = {
      receipt_number: purchaseForm.receipt_number || undefined,
      total_amount: totalAmount.toFixed(2),
      notes: purchaseForm.notes || undefined,
      purchased_at: new Date().toISOString(),
      items: [
        {
          product_id: purchaseForm.product_id,
          quantity: qty,
          unit_cost: unitCost.toFixed(2),
          subtotal: totalAmount.toFixed(2),
        },
      ],
    };

    try {
      await createPurchase(outletFilter, payload);
      setMsg({
        type: 'success',
        text: 'Pembelian stok berhasil dicatat! Stok bertambah & Moving Average HPP dihitung otomatis.',
      });
      setIsPurchaseModalOpen(false);
      setPurchaseForm({
        receipt_number: '',
        product_id: products[0]?.id || '',
        quantity: 1,
        unit_cost: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal mencatat pembelian stok' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Pengeluaran & Pembelian</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Biaya Operasional & Pembelian Stok
          </h1>
          <p className="text-slate-500 text-sm">
            Catat kas keluar dan restok bahan baku dengan kalkulasi Moving Average HPP otomatis
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/60">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Kas Keluar</span>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'purchases'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pembelian (Restok)</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'export'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Laporan</span>
          </button>
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

      {outletFilter === 'ALL' ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Pilih Cabang / Outlet Spesifik
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Biaya operasional dan pembelian stok dicatat per cabang. Silakan pilih outlet dari dropdown di pojok kanan atas.
          </p>
        </div>
      ) : activeTab === 'expenses' ? (
        /* Expenses Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Kas Keluar
              </span>
              <p className="text-2xl font-bold text-rose-600">{formatRupiah(totalExpenseAmount)}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {expenses.length} transaksi pengeluaran tercatat
              </span>
            </div>
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Pengeluaran Baru</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Tanggal</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6">Keterangan</th>
                    <th className="py-4 px-6 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingExpenses ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        <span>Memuat data pengeluaran...</span>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        Belum ada catatan pengeluaran kas.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                          {item.expense_date}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-800 font-medium">
                          {item.description || '-'}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-rose-600">
                          {formatRupiah(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'purchases' ? (
        /* Purchases Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Pembelian / Restok
              </span>
              <p className="text-2xl font-bold text-teal-600">{formatRupiah(totalPurchaseAmount)}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {purchases.length} nota pembelian masuk
              </span>
            </div>
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Input Restok Barang (Moving Avg HPP)</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Waktu Pembelian</th>
                    <th className="py-4 px-6">No. Nota / Faktur</th>
                    <th className="py-4 px-6">Catatan</th>
                    <th className="py-4 px-6 text-right">Total Pembelian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingPurchases ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        <span>Memuat data pembelian...</span>
                      </td>
                    </tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        Belum ada pembelian stok tercatat.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 text-slate-600 text-xs font-mono">
                          {new Date(p.purchased_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800 font-mono text-xs">
                          {p.invoice_number || '-'}
                        </td>
                        <td className="py-4 px-6 text-slate-600">{p.notes || '-'}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-800">
                          {formatRupiah(p.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Export Tab */
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-600" />
              <span>Export Laporan Transaksi & Keuangan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Unduh rekap data transaksi cabang {outletFilter} untuk arsip laporan pajak atau pembukuan Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={getExportUrl('excel', selectedMonth, selectedYear, outletFilter)}
              target="_blank"
              rel="noreferrer"
              className="p-6 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div>
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-slate-800 text-sm">Unduh File Excel (.xlsx)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Format tabel rapi untuk pengolahan spreadsheet.
                </p>
              </div>
              <span className="inline-block mt-4 text-xs font-bold text-emerald-600">
                Download Excel &rarr;
              </span>
            </a>

            <a
              href={getExportUrl('pdf', selectedMonth, selectedYear, outletFilter)}
              target="_blank"
              rel="noreferrer"
              className="p-6 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 rounded-2xl flex flex-col justify-between transition-all group"
            >
              <div>
                <FileText className="w-8 h-8 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-slate-800 text-sm">Unduh Dokumen PDF</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Format cetak siap print untuk laporan bulanan.
                </p>
              </div>
              <span className="inline-block mt-4 text-xs font-bold text-rose-600">
                Download PDF &rarr;
              </span>
            </a>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Catat Kas Keluar (Expense)</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Biaya
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Operasional">Operasional (Listrik, Air, Gas)</option>
                  <option value="Gaji Pegawai">Gaji & Upah Pegawai</option>
                  <option value="Pemasaran">Pemasaran & Iklan</option>
                  <option value="Perlengkapan">Perlengkapan Kasir & Toko</option>
                  <option value="Lainnya">Pengeluaran Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Contoh: Beli token listrik & es batu kristal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="Contoh: 150000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tanggal Pengeluaran
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Biaya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Input Pembelian Stok</h3>
                <p className="text-[11px] text-teal-600 font-medium">
                  Sistem otomatis menghitung Moving Average HPP
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Produk / Bahan yang Dibeli
                </label>
                <select
                  value={purchaseForm.product_id}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, product_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.stock_quantity ?? 0} {p.unit || 'pcs'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Harga Beli Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseForm.unit_cost}
                    onChange={(e) =>
                      setPurchaseForm({ ...purchaseForm, unit_cost: e.target.value })
                    }
                    placeholder="Contoh: 15000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. Nota / Faktur Supplier
                </label>
                <input
                  type="text"
                  value={purchaseForm.receipt_number}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, receipt_number: e.target.value })
                  }
                  placeholder="Contoh: INV-SUPP-001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  placeholder="Supplier / Nama Toko"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-bold text-slate-800">
                <span>Total Biaya Restok:</span>
                <span className="text-teal-600">
                  {formatRupiah(
                    (parseFloat(purchaseForm.unit_cost) || 0) * (purchaseForm.quantity || 1)
                  )}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pembelian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
