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
  Sparkles,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { getOutletSettings, updateOutletSettings } from '@/lib/api';
import { OutletSettings } from '@/types';

export default function SettingsPage() {
  const { outletFilter, outlets } = useOutlet();

  const [settings, setSettings] = useState<OutletSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    tax_percent: '10.00',
    service_percent: '5.00',
    receipt_header: 'POS BWX RESTORAN',
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
      setErrorMsg(err.message || 'Gagal memuat pengaturan outlet');
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
      setErrorMsg('Pilih outlet spesifik di header terlebih dahulu.');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await updateOutletSettings(outletFilter, form);
      setSettings(updated);
      setSuccessMsg('Pengaturan cabang berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const currentOutletName =
    outlets?.find((o) => o.slug === outletFilter)?.name || outletFilter;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Manajemen Cabang</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Pengaturan Outlet & Struk
          </h1>
          <p className="text-slate-500 text-sm">
            Konfigurasi nama cabang, tarif pajak, biaya layanan, dan format struk kasir
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading || outletFilter === 'ALL'}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {outletFilter === 'ALL' ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">
            Pilih Cabang / Outlet Spesifik
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Pengaturan struk dan pajak berlaku per masing-masing cabang. Silakan pilih outlet dari dropdown di pojok kanan atas untuk melihat dan mengubah pengaturan.
          </p>
        </div>
      ) : (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <span>Pengaturan Cabang: {currentOutletName}</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Nama Cabang / Outlet
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    placeholder="Contoh: Restoran Utama BWX"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Pajak Restoran (%)
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
                      PB1 / PPN yang diterapkan pada kasir
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
                      Biaya servis operasional meja
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="Nama Usaha / Alamat di bagian atas struk"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Teks ini akan tercetak paling atas pada struk kasir
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Footer Struk Thermal
                  </label>
                  <textarea
                    rows={2}
                    value={form.receipt_footer}
                    onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="Ucapan terima kasih / Password WiFi / Sosmed"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Tercetak di bagian paling bawah struk pembayaran
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Receipt Preview Section */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span>Preview Struk Kasir (Thermal 58mm/80mm)</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-slate-800 font-mono text-xs space-y-3 relative overflow-hidden">
                  <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                    <p className="font-bold text-sm tracking-wide">
                      {form.receipt_header || 'POS BWX'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Cabang: {form.name || currentOutletName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}
                    </p>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Nasi Goreng Spesial x2</span>
                      <span>50.000</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Es Teh Manis x2</span>
                      <span>16.000</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>66.000</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Pajak ({form.tax_percent}%)</span>
                      <span>
                        {(
                          (66000 * parseFloat(form.tax_percent || '0')) /
                          100
                        ).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {parseFloat(form.service_percent || '0') > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Layanan ({form.service_percent}%)</span>
                        <span>
                          {(
                            (66000 * parseFloat(form.service_percent || '0')) /
                            100
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 text-slate-900">
                      <span>TOTAL</span>
                      <span>
                        {(
                          66000 +
                          (66000 * parseFloat(form.tax_percent || '0')) / 100 +
                          (66000 * parseFloat(form.service_percent || '0')) / 100
                        ).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500">
                    <p>{form.receipt_footer || 'Terima kasih atas kunjungan Anda'}</p>
                    <p className="text-[9px] text-slate-400 mt-2 font-sans font-semibold">
                      Powered by POS BWX by danz
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
