'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ban,
  User,
  CreditCard,
  Banknote,
  Store,
  X,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import {
  getProducts,
  getCustomers,
  getTransactionsList,
  createTransactionSale,
  voidTransaction,
  formatRupiah,
} from '@/lib/api';
import { Product, Customer, Transaction } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function TransactionsPage() {
  const { outletFilter, outlets } = useOutlet();

  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // POS State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'QRIS'>('TUNAI');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // History State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [searchTx, setSearchTx] = useState<string>('');

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState<boolean>(false);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');
  const [voiding, setVoiding] = useState<boolean>(false);

  // Success / Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [latestTransaction, setLatestTransaction] = useState<any | null>(null);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async () => {
    if (outletFilter === 'ALL') return;
    setLoading(true);
    setMsg(null);
    try {
      const [prods, custs, txs] = await Promise.all([
        getProducts(outletFilter).catch(() => []),
        getCustomers(outletFilter).catch(() => []),
        getTransactionsList(outletFilter).catch(() => []),
      ]);
      setProducts(prods || []);
      setCustomers(custs || []);
      setTransactions(txs || []);
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: err.message || 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setCart([]);
  }, [outletFilter]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.price || '0') * item.quantity,
    0
  );
  const taxAmount = subtotal * 0.1; // Default 10%
  const grandTotal = subtotal + taxAmount;
  const numAmountPaid = parseFloat(amountPaid) || 0;
  const changeAmount = paymentMethod === 'TUNAI' ? Math.max(0, numAmountPaid - grandTotal) : 0;

  // Checkout Handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setMsg({ type: 'error', text: 'Keranjang belanja masih kosong.' });
      return;
    }
    if (paymentMethod === 'TUNAI' && numAmountPaid < grandTotal) {
      setMsg({ type: 'error', text: 'Nominal pembayaran tunai kurang dari total belanja.' });
      return;
    }

    setLoading(true);
    setMsg(null);

    const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now();
    const payload = {
      id: txId,
      device_id: 'admin-pos-browser',
      customer_id: selectedCustomerId || undefined,
      subtotal: subtotal.toFixed(2),
      discount_amount: '0.00',
      tax_amount: taxAmount.toFixed(2),
      service_amount: '0.00',
      grand_total: grandTotal.toFixed(2),
      notes: notes || undefined,
      items: cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.product.price || '0').toFixed(2),
        cost_price_snapshot: parseFloat(item.product.cogs || '0').toFixed(2),
        subtotal: (parseFloat(item.product.price || '0') * item.quantity).toFixed(2),
      })),
      payments: [
        {
          method: paymentMethod,
          amount: grandTotal.toFixed(2),
          amount_received: (paymentMethod === 'TUNAI' ? numAmountPaid : grandTotal).toFixed(2),
          change_amount: changeAmount.toFixed(2),
        },
      ],
    };

    try {
      const res = await createTransactionSale(outletFilter, payload);
      setLatestTransaction({ ...payload, result: res });
      setCart([]);
      setAmountPaid('');
      setNotes('');
      setIsReceiptModalOpen(true);
      setMsg({ type: 'success', text: 'Transaksi berhasil diselesaikan & dijurnal otomatis!' });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal memproses transaksi kasir' });
    } finally {
      setLoading(false);
    }
  };

  // Void Handler
  const handleOpenVoid = (tx: Transaction) => {
    setSelectedTxForVoid(tx);
    setVoidReason('');
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedTxForVoid || !voidReason) return;
    setVoiding(true);
    try {
      await voidTransaction(outletFilter, selectedTxForVoid.id, voidReason);
      setMsg({ type: 'success', text: 'Transaksi berhasil di-VOID (stok & jurnal dibatalkan)' });
      setIsVoidModalOpen(false);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal melakukan void transaksi' });
    } finally {
      setVoiding(false);
    }
  };

  // Filtered products & transactions
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()));
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredTransactions = transactions.filter((t) => {
    return (
      (t.receipt_number && t.receipt_number.toLowerCase().includes(searchTx.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTx.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir & Penjualan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Transaksi Penjualan & Void
          </h1>
          <p className="text-slate-500 text-sm">
            Checkout kasir langsung terhubung dengan pemotongan stok dan jurnal akuntansi otomatis
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/60">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'pos'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir POS (Checkout)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Riwayat & Void ({transactions.length})</span>
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
            Pilih Unit Usaha Spesifik
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Transaksi kasir dan pembatalan (void) harus terikat pada unit usaha tertentu. Silakan pilih unit usaha di dropdown atas.
          </p>
        </div>
      ) : activeTab === 'pos' ? (
        /* POS Checkout View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Products Catalog (Left) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Pills */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Cari menu / produk berdasarkan nama atau SKU..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white border border-slate-100 hover:border-teal-500 rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      {p.category || 'Menu'}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-teal-600 transition-colors line-clamp-2">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-teal-600 text-xs">
                      {formatRupiah(p.price)}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Checkout Panel (Right) */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" />
                <span>Keranjang ({cart.length} item)</span>
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Klik menu di sebelah kiri untuk menambah ke keranjang
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 text-xs truncate">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatRupiah(item.product.price)} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-slate-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Payment Form */}
            <form onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pelanggan (Opsional / CRM)
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="">-- Tamu Umum / Non Member --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.member_type === 'vip' ? '★ VIP' : ''} ({c.phone || '-'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TUNAI')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'TUNAI'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>TUNAI (CASH)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'QRIS'
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>QRIS / EWALLET</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'TUNAI' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min={grandTotal}
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={`Min: ${grandTotal.toLocaleString('id-ID')}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                  {numAmountPaid >= grandTotal && (
                    <div className="mt-1 text-xs text-teal-600 font-bold flex justify-between">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Pajak Restoran (10%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>TOTAL AKHIR</span>
                  <span className="text-teal-600">{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Memproses Transaksi...' : 'Bayar & Cetak Struk'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* History & Void View */
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                placeholder="Cari no. struk atau ID transaksi..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <button
              onClick={loadData}
              className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">No. Struk</th>
                  <th className="py-4 px-6">Waktu Transaksi</th>
                  <th className="py-4 px-6">Total Belanja</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Belum ada transaksi di cabang ini.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800 font-mono text-xs">
                          {tx.receipt_number || tx.id.slice(0, 10)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {formatRupiah(tx.grand_total)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {tx.status === 'PAID' ? (
                          <button
                            onClick={() => handleOpenVoid(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Void Transaksi</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Dibatalkan</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {isVoidModalOpen && selectedTxForVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Void Transaksi Kasir</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedTxForVoid.receipt_number || selectedTxForVoid.id}
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl space-y-1">
              <p className="font-bold">Perhatian Akuntansi & Stok:</p>
              <p>
                Proses VOID akan otomatis mengembalikan stok barang ke gudang dan membalikkan (reverse) jurnal kas & penjualan di buku besar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alasan Pembatalan (Void Reason)
              </label>
              <textarea
                rows={3}
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Contoh: Salah input pesanan meja / pelanggan batal beli..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={voiding || !voidReason.trim()}
                onClick={handleConfirmVoid}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {voiding ? 'Membatalkan...' : 'Konfirmasi VOID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {isReceiptModalOpen && latestTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-100 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-lg">Pembayaran Berhasil!</h3>
              <p className="text-xs text-slate-500">
                Stok barang berkurang & Jurnal Ganda telah dibuat.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs font-mono space-y-1.5 text-slate-700">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatRupiah(latestTransaction.grand_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span>{latestTransaction.payments[0].method}</span>
              </div>
              {latestTransaction.payments[0].change_amount > 0 && (
                <div className="flex justify-between text-teal-600 font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(latestTransaction.payments[0].change_amount)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Selesai (Transaksi Baru)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
