'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  createStockOpname,
  getCategories,
  createCategory,
  deleteCategory,
  formatRupiah,
} from '@/lib/api';
import { Product, Category } from '@/types';

export default function InventoryPage() {
  const { outletFilter } = useOutlet();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modals state
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newCatName, setNewCatName] = useState<string>('');
  const [catLoading, setCatLoading] = useState<boolean>(false);

  // Form states
  const [opnameActualStock, setOpnameActualStock] = useState<number>(0);
  const [opnameNewPrice, setOpnameNewPrice] = useState<string>('');
  const [opnameNewCogs, setOpnameNewCogs] = useState<string>('');
  const [opnameNotes, setOpnameNotes] = useState<string>('');

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Makanan',
    price: '',
    cogs: '',
    stock_quantity: 0,
    min_stock: 5,
    unit: 'Pcs',
    outlet_type: 'RESTORAN' as 'RESTORAN' | 'CAFE',
  });

  const loadCategories = async () => {
    if (outletFilter === 'ALL') return;
    try {
      const data = await getCategories(outletFilter);
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        getProducts(outletFilter, selectedCategory),
        getCategories(outletFilter).catch(() => []),
      ]);
      setProducts(prodData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [outletFilter, selectedCategory]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || outletFilter === 'ALL') return;
    setCatLoading(true);
    try {
      await createCategory(outletFilter, { name: newCatName.trim() });
      setNewCatName('');
      loadCategories();
    } catch (err) {
      alert('Gagal menambah kategori');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await deleteCategory(outletFilter, id);
      loadCategories();
    } catch (err) {
      alert('Gagal menghapus kategori');
    }
  };

  // Filtered products by search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Critical stock check (< 5)
  const criticalProducts = products.filter((p) => p.stock_quantity < 5);
  const availableProducts = products.filter((p) => p.stock_quantity > 0);
  const emptyProducts = products.filter((p) => p.stock_quantity <= 0);

  // Handlers
  const handleOpenOpname = (product: Product) => {
    setSelectedProduct(product);
    setOpnameActualStock(product.stock_quantity);
    setOpnameNewPrice(product.price);
    setOpnameNewCogs(product.cogs);
    setOpnameNotes('Penyesuaian stok fisik berkala');
    setIsOpnameModalOpen(true);
  };

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      // 1. Submit stock opname
      await createStockOpname(outletFilter, {
        product_id: selectedProduct.id,
        actual_stock: Number(opnameActualStock),
        notes: opnameNotes,
      });

      // 2. Update price / cogs if changed
      if (
        opnameNewPrice !== selectedProduct.price ||
        opnameNewCogs !== selectedProduct.cogs
      ) {
        await updateProduct(outletFilter, selectedProduct.id, {
          price: opnameNewPrice,
          cogs: opnameNewCogs,
        });
      }

      setIsOpnameModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan opname: ${err.message}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct(outletFilter, productForm);
      setIsProductModalOpen(false);
      setProductForm({
        name: '',
        sku: '',
        category: 'Makanan',
        price: '',
        cogs: '',
        stock_quantity: 0,
        min_stock: 5,
        unit: 'Pcs',
        outlet_type: 'RESTORAN',
      });
      loadData();
    } catch (err: any) {
      alert(`Gagal menambah produk: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus produk "${name}"?`)) {
      try {
        await deleteProduct(outletFilter, id);
        loadData();
      } catch (err: any) {
        alert(`Gagal menghapus produk: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header Action Buttons (Kolabo Image 2 Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-slate-600">
              Dasbor
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">Stok Produk & Layanan</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
            Produk & Layanan
          </h1>
        </div>

        {/* Action icons right (Kolabo style: Cyan refresh, Teal Export, Cyan Plus) */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <span>Kelola Kategori</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* BANNER ALERT: STOK KRITIS (< 5) (Poin 11) */}
      {criticalProducts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-rose-900 text-sm">
              Peringatan: Stok Kritis Terdeteksi!
            </div>
            <div className="text-xs text-rose-700 mt-0.5">
              Terdapat <strong>{criticalProducts.length} produk</strong> dengan sisa
              stok kurang dari 5 pcs:{' '}
              <span className="font-semibold underline">
                {criticalProducts.map((p) => `${p.name} (${p.stock_quantity})`).join(', ')}
              </span>
              . Segera lakukan pengadaan atau Stok Opname.
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards: Terdaftar, Tersedia, Habis, Kritis (Poin 5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Produk</div>
            <div className="text-xl font-bold text-slate-800">{products.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Stok Tersedia</div>
            <div className="text-xl font-bold text-emerald-600">
              {availableProducts.length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Stok Kosong</div>
            <div className="text-xl font-bold text-rose-600">{emptyProducts.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Stok Kritis (&lt;5)</div>
            <div className="text-xl font-bold text-amber-600">
              {criticalProducts.length}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CARD (Kolabo Image 2 Style) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 rounded-xl px-3.5 py-2.5 outline-none cursor-pointer focus:border-teal-500"
          >
            <option value="">Semua Kategori</option>
            {categories.length > 0 ? (
              categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))
            ) : (
              <>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Snack">Snack</option>
              </>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            className="p-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
            title="Terapkan Filter"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchTerm('');
            }}
            className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-sm"
            title="Reset Filter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PRODUCT TABLE CONTAINER (Kolabo Image 2 Style) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Search & Entries Header */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-800">{filteredProducts.length}</strong> entri
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Outlet</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Harga Beli (HPP)</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-center">Sisa Kuantitas</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isCritical = p.stock_quantity < 5;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.outlet_type === 'RESTORAN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {p.outlet_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatRupiah(p.cogs)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.stock_quantity} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Opname Button */}
                          <button
                            onClick={() => handleOpenOpname(p)}
                            className="p-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                            title="Stok Opname & Perbarui Harga"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM: STOK OPNAME & UPDATE HARGA (Poin 7) */}
      {isOpnameModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Stok Opname & Update Harga
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Produk: <span className="font-semibold text-teal-600">{selectedProduct.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsOpnameModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpname} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400">Stok Sistem:</span>
                  <div className="text-base font-bold text-slate-800">
                    {selectedProduct.stock_quantity} {selectedProduct.unit}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Selisih Fisik:</span>
                  <div
                    className={`text-base font-bold ${
                      opnameActualStock - selectedProduct.stock_quantity < 0
                        ? 'text-rose-600'
                        : opnameActualStock - selectedProduct.stock_quantity > 0
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {opnameActualStock - selectedProduct.stock_quantity > 0 ? '+' : ''}
                    {opnameActualStock - selectedProduct.stock_quantity}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah Stok Fisik Riil (Hasil Hitung Manual) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={opnameActualStock}
                  onChange={(e) => setOpnameActualStock(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Jual Baru (Rp)
                  </label>
                  <input
                    type="number"
                    value={opnameNewPrice}
                    onChange={(e) => setOpnameNewPrice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    HPP / Beli Baru (Rp)
                  </label>
                  <input
                    type="number"
                    value={opnameNewCogs}
                    onChange={(e) => setOpnameNewCogs(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Opname
                </label>
                <textarea
                  rows={2}
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  placeholder="Contoh: Barang basi, rusak, atau salah hitung..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpnameModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM: TAMBAH PRODUK BARU */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                Tambah Produk Baru
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Contoh: Matcha Latte"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SKU / Kode Barang *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="CF-003"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Outlet *
                  </label>
                  <select
                    value={productForm.outlet_type}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        outlet_type: e.target.value as 'RESTORAN' | 'CAFE',
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="RESTORAN">Restoran</option>
                    <option value="CAFE">Cafe</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({ ...productForm, category: e.target.value })
                    }
                    placeholder="Minuman / Makanan"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) =>
                      setProductForm({ ...productForm, unit: e.target.value })
                    }
                    placeholder="Cup, Porsi, Pcs"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    placeholder="25000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    HPP / Biaya Modal (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.cogs}
                    onChange={(e) =>
                      setProductForm({ ...productForm, cogs: e.target.value })
                    }
                    placeholder="12000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock_quantity}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock_quantity: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Minimum Stok
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.min_stock}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        min_stock: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Kelola Kategori Menu</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <button
                type="submit"
                disabled={catLoading || !newCatName.trim()}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {catLoading ? '...' : 'Tambah'}
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pt-2 divide-y divide-slate-50">
              {categories.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada kategori custom.
                </div>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="pt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
