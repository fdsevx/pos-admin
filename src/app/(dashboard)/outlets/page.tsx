'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  ArrowRight,
  ShieldCheck,
  X,
  Package,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { createOutlet, deleteOutlet, createLocation } from '@/lib/api';

export default function OutletsPage() {
  const router = useRouter();
  const { outletFilter, setOutletFilter, outlets, refreshOutlets, userProfile, locations } = useOutlet();

  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modal Tambah Unit Usaha
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Tambah Lokasi / Cabang
  const [isLocModalOpen, setIsLocModalOpen] = useState<boolean>(false);
  const [locName, setLocName] = useState<string>('');
  const [locSubmitting, setLocSubmitting] = useState<boolean>(false);

  const isSuperAdmin = userProfile?.role === 'super_admin';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!locationId) {
      setErrorMsg('Pilih Lokasi terlebih dahulu');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const created = await createOutlet({
        name: name.trim(),
        slug: slug.trim() || undefined,
        location_id: locationId,
        is_active: true,
      });

      await refreshOutlets();
      setSuccessMsg(`Unit Usaha "${created.name || name}" berhasil didaftarkan!`);
      setName('');
      setSlug('');
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan unit usaha baru');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    setLocSubmitting(true);
    setErrorMsg('');
    try {
      const generatedCode = locName.trim().substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '') + Math.floor(Math.random() * 10000);
      
      // Tutup modal lebih awal agar terasa instan
      setIsLocModalOpen(false);
      setSuccessMsg(`Memproses penambahan lokasi...`);
      
      const created = await createLocation({ 
        name: locName.trim(),
        code: generatedCode,
      });
      
      await refreshOutlets();
      setSuccessMsg(`Lokasi "${created.name}" berhasil didaftarkan!`);
      setLocName('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan lokasi baru');
      setIsLocModalOpen(true); // buka kembali jika gagal
    } finally {
      setLocSubmitting(false);
    }
  };

  const handleDelete = async (id: string, outletName: string) => {
    if (!confirm(`Yakin ingin menghapus unit usaha "${outletName}"? Seluruh data katalog & transaksi unit ini tidak akan dapat diakses.`)) {
      return;
    }

    try {
      await deleteOutlet(id);
      await refreshOutlets();
      if (outletFilter === id) {
        setOutletFilter('ALL');
      }
      setSuccessMsg(`Unit usaha "${outletName}" berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus unit usaha');
    }
  };

  const handleSelectUnit = (unitSlug: string, targetPath: string = '/inventory') => {
    setOutletFilter(unitSlug);
    router.push(targetPath);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-slate-600">
              Dasbor
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">Manajemen Unit Usaha</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
            Manajemen Unit Usaha
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh cabang dan unit bisnis (Restoran, Cafe, Barbershop, dll) yang beroperasi dalam sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              await refreshOutlets();
              setLoading(false);
            }}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsLocModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Lokasi Induk</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Unit Usaha</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{outlets?.length || 0}</div>
            <div className="text-xs font-semibold text-slate-400">Total Unit Usaha Aktif</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {isSuperAdmin ? 'Super Admin' : (userProfile?.role || 'Manager')}
            </div>
            <div className="text-xs font-semibold text-slate-400">Tingkat Hak Akses Anda</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {outletFilter === 'ALL' ? 'Semua Unit' : (outlets?.find(o => o.slug === outletFilter)?.name || outletFilter)}
            </div>
            <div className="text-xs font-semibold text-slate-400">Unit Usaha Terpilih</div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-teal-600" />
              <span>Daftar Unit Usaha Terdaftar</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap unit usaha beroperasi secara mandiri: produk, kasir, dan akuntansi tidak tercampur.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 w-fit">
            {outlets?.length || 0} Unit Usaha
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Nama Unit Usaha</th>
                <th className="py-4 px-6">Slug URL API</th>
                <th className="py-4 px-6">ID Unit (UUID)</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi & Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!outlets || outlets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada unit usaha terdaftar. Silakan klik tombol "Tambah Unit Usaha".
                  </td>
                </tr>
              ) : (
                outlets.map((o) => {
                  const isCurrent = outletFilter === o.slug;
                  return (
                    <tr key={o.id} className={`hover:bg-slate-50/60 transition-colors ${isCurrent ? 'bg-teal-50/20' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            o.slug?.includes('cafe') 
                              ? 'bg-amber-100 text-amber-800'
                              : o.slug?.includes('barber')
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {o.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{o.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-500 text-white rounded-full">
                                  Sedang Dipilih
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">Unit Bisnis Aktif</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-teal-700 font-bold">
                        /{o.slug}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {o.id}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                          {o.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSelectUnit(o.slug, '/inventory')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            title="Buka katalog produk unit ini"
                          >
                            <Package className="w-3.5 h-3.5 text-slate-500" />
                            <span>Katalog</span>
                          </button>

                          <button
                            onClick={() => handleSelectUnit(o.slug, '/transactions')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            title="Buka kasir transaksi unit ini"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                            <span>Kasir</span>
                          </button>

                          <button
                            onClick={() => handleSelectUnit(o.slug, '/settings')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors"
                            title="Konfigurasi struk thermal & pajak unit ini"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Struk & Pajak</span>
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(o.id, o.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Unit Usaha"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Guide Flow Card (3-Step Integration Flow) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-base font-bold text-teal-400 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          <span>Alur Integrasi Bisnis Multi-Unit (WKB)</span>
        </h3>
        <p className="text-xs text-slate-300 mb-6">
          Sistem mendukung pemisahan penuh antar unit usaha namun tetap menyajikan laporan agregat di Dasbor:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-xs font-bold text-teal-400 mb-1">1. Buat Unit Usaha</div>
            <p className="text-[11px] text-slate-300">
              Buat unit usaha baru seperti <strong>WKB - Cafe</strong>, <strong>WKB - Resto</strong>, dan <strong>WKB - Barbershop</strong> via tombol di atas.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-xs font-bold text-teal-400 mb-1">2. Atur Akses Pegawai</div>
            <p className="text-[11px] text-slate-300">
              Buka menu <strong>Kasir & Staf</strong>, lalu beri centang pada Unit Usaha yang boleh diakses akun Manager atau Kasir.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-xs font-bold text-teal-400 mb-1">3. Operasional Mandiri</div>
            <p className="text-[11px] text-slate-300">
              Manager memilih unit di pojok kanan atas untuk mengisi menu & memantau transaksi. Laporan terpisah namun omzet total tersaji di Dasbor.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH UNIT USAHA BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-600" />
                <span>Tambah Unit Usaha Baru</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Pilih Lokasi (Cabang) *
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="" disabled>-- Pilih Lokasi --</option>
                  {locations?.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Nama Unit Usaha *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+|-+$/g, '')
                      );
                    }
                  }}
                  placeholder="Contoh: WKB Cafe, WKB Resto, atau WKB Barbershop"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Slug / URL Identifier (Opsional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Unit Usaha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH LOKASI INDUK */}
      {isLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-slate-800" />
                <span>Tambah Lokasi Induk</span>
              </h3>
              <button
                onClick={() => setIsLocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Nama Lokasi / Cabang *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Contoh: Cabang Sudirman, Malang Pusat"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={locSubmitting || !locName.trim()}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                >
                  {locSubmitting ? 'Menyimpan...' : 'Simpan Lokasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
