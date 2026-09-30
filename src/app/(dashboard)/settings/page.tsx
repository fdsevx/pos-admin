'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Store,
  Receipt,
  Percent,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  ExternalLink,
  X,
  Shield,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { getOutletSettings, updateOutletSettings, createOutlet, deleteOutlet } from '@/lib/api';
import { OutletSettings } from '@/types';

export default function SettingsPage() {
  const { outletFilter, setOutletFilter, outlets, refreshOutlets, userProfile } = useOutlet();

  const [settings, setSettings] = useState<OutletSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Add Outlet Modal State
  const [isCreateOutletModalOpen, setIsCreateOutletModalOpen] = useState<boolean>(false);
  const [newOutletName, setNewOutletName] = useState<string>('');
  const [newOutletSlug, setNewOutletSlug] = useState<string>('');
  const [creatingOutlet, setCreatingOutlet] = useState<boolean>(false);

  const [form, setForm] = useState({
    name: '',
    tax_percent: '10.00',
    service_percent: '5.00',
    receipt_header: 'POS RESTORAN',
    receipt_footer: 'Terima kasih atas kunjungan Anda!',
  });

  const loadSettings = async () => {
    if (outletFilter === 'ALL') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getOutletSettings(outletFilter);
      if (data) {
        setSettings(data);
        setForm({
          name: data.name || '',
          tax_percent: data.tax_percent || '10.00',
          service_percent: data.service_percent || '5.00',
          receipt_header: data.receipt_header || '',
          receipt_footer: data.receipt_footer || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setErrorMsg(err.message || 'Gagal memuat pengaturan unit usaha');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [outletFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (outletFilter === 'ALL') {
      setErrorMsg('Pilih unit usaha spesifik terlebih dahulu.');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await updateOutletSettings(outletFilter, form);
      setSettings(updated);
      await refreshOutlets();
      setSuccessMsg('Pengaturan unit usaha berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;

    setCreatingOutlet(true);
    setErrorMsg('');
    try {
      const created = await createOutlet({
        name: newOutletName.trim(),
        slug: newOutletSlug.trim() || undefined,
      });

      await refreshOutlets();
      setSuccessMsg(`Unit Usaha "${created.name || newOutletName}" berhasil dibuat!`);
      setNewOutletName('');
      setNewOutletSlug('');
      setIsCreateOutletModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat unit usaha baru');
    } finally {
      setCreatingOutlet(false);
    }
  };

  const handleDeleteOutlet = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus unit usaha "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await deleteOutlet(id);
      await refreshOutlets();
      if (outletFilter === id) {
        setOutletFilter('ALL');
      }
      setSuccessMsg(`Unit usaha "${name}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus unit usaha');
    }
  };

  const currentOutletName =
    outlets?.find((o) => o.slug === outletFilter)?.name || outletFilter;

  const isSuperAdmin = userProfile?.role === 'super_admin';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Manajemen Bisnis Multi-Unit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {outletFilter === 'ALL'
              ? 'Daftar Unit Usaha'
              : `Pengaturan Unit Usaha: ${currentOutletName}`}
          </h1>
          <p className="text-slate-500 text-sm">
            {outletFilter === 'ALL'
              ? 'Kelola seluruh cabang dan unit usaha (Resto, Cafe, Barbershop, dll)'
              : 'Konfigurasi nama unit usaha, tarif pajak, biaya layanan, dan format struk kasir'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {outletFilter !== 'ALL' && (
            <button
              onClick={() => setOutletFilter('ALL')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              ← Lihat Semua Unit Usaha
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setIsCreateOutletModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Unit Usaha</span>
            </button>
          )}

          <button
            onClick={outletFilter === 'ALL' ? refreshOutlets : loadSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* VIEW ALL UNIT USAHA (Mode ALL) */}
      {outletFilter === 'ALL' ? (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Store className="w-5 h-5 text-teal-600" />
                  <span>Daftar Unit Usaha Aktif</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Setiap unit usaha memiliki katalog menu, transaksi kasir, dan laporan keuangan terpisah.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
                {outlets?.length || 0} Unit Usaha
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Nama Unit Usaha</th>
                    <th className="py-4 px-6">Slug URL API</th>
                    <th className="py-4 px-6">ID Unit (UUID)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!outlets || outlets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Belum ada unit usaha terdaftar. Silakan buat unit usaha baru.
                      </td>
                    </tr>
                  ) : (
                    outlets.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-800">{o.name}</div>
                          <div className="text-[11px] text-slate-400">Cabang POS Operasional</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-teal-700 font-semibold">
                          /{o.slug}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {o.id}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            Aktif
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => setOutletFilter(o.slug)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors"
                            title="Konfigurasi struk dan pajak unit ini"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Atur Struk & Pajak</span>
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteOutlet(o.id, o.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Unit Usaha"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
        /* EDIT SPECIFIC UNIT USAHA SETTINGS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-600" />
              <span>Pengaturan Unit Usaha: {currentOutletName}</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Unit Usaha
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="Contoh: WKB - Resto"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Pajak Restoran / Usaha (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={form.tax_percent}
                      onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                      className="w-full pl-4 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="10.00"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    PB1 / PPN yang diterapkan pada kasir unit ini
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Biaya Layanan (Service %)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={form.service_percent}
                      onChange={(e) => setForm({ ...form, service_percent: e.target.value })}
                      className="w-full pl-4 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      placeholder="5.00"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Biaya servis operasional unit ini
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Header Struk Thermal
                </label>
                <textarea
                  rows={2}
                  value={form.receipt_header}
                  onChange={(e) => setForm({ ...form, receipt_header: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono text-xs"
                  placeholder="Nama Toko, Alamat, No Telepon"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Footer Struk Thermal
                </label>
                <textarea
                  rows={2}
                  value={form.receipt_footer}
                  onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono text-xs"
                  placeholder="Pesan terima kasih atau informasi promo"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Thermal Receipt Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                <span>Simulasi Tampilan Struk Kasir</span>
              </h3>

              <div className="bg-amber-50/50 border border-dashed border-amber-200 rounded-2xl p-6 font-mono text-[11px] text-slate-700 leading-relaxed shadow-inner">
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <div className="font-bold text-xs uppercase tracking-wider">
                    {form.name || currentOutletName}
                  </div>
                  <div className="whitespace-pre-line text-slate-500 mt-1">
                    {form.receipt_header || 'Jl. Utama No. 123\nTelp: 0812-3456-7890'}
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>No: #INV-202609-001</span>
                    <span>30/09/2026 12:45</span>
                  </div>
                  <div>Kasir: Budi Manager</div>
                </div>

                <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span>1x Menu Favorit</span>
                    <span>35.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Minuman Dingin</span>
                    <span>15.000</span>
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>50.000</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Pajak ({form.tax_percent}%)</span>
                    <span>
                      {(50000 * (parseFloat(form.tax_percent) || 0) / 100).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Service ({form.service_percent}%)</span>
                    <span>
                      {(50000 * (parseFloat(form.service_percent) || 0) / 100).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-slate-300 text-slate-900">
                    <span>TOTAL</span>
                    <span>
                      {(
                        50000 +
                        50000 * (parseFloat(form.tax_percent) || 0) / 100 +
                        50000 * (parseFloat(form.service_percent) || 0) / 100
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="text-center pt-3 text-slate-500 text-[10px] whitespace-pre-line">
                  {form.receipt_footer || 'Terima kasih atas kunjungan Anda!'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH UNIT USAHA BARU */}
      {isCreateOutletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-600" />
                <span>Tambah Unit Usaha Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateOutletModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOutlet} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Nama Unit Usaha *
                </label>
                <input
                  type="text"
                  required
                  value={newOutletName}
                  onChange={(e) => {
                    setNewOutletName(e.target.value);
                    if (!newOutletSlug) {
                      setNewOutletSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')
                      );
                    }
                  }}
                  placeholder="Contoh: WKB - Cafe atau WKB - Resto"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Slug / URL Identifier (Opsional)
                </label>
                <input
                  type="text"
                  value={newOutletSlug}
                  onChange={(e) =>
                    setNewOutletSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  placeholder="wkb-cafe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Akan digunakan sebagai path URL API (contoh: <code>/api/v1/wkb-cafe/products</code>)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOutletModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingOutlet || !newOutletName.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                >
                  {creatingOutlet ? 'Membuat...' : 'Buat Unit Usaha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
