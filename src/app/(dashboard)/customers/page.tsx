'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  Award,
  History,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Store,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  formatRupiah,
} from '@/lib/api';
import { Customer, Transaction } from '@/types';

export default function CustomersPage() {
  const { outletFilter } = useOutlet();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    member_type: 'regular' as 'regular' | 'vip',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCustomers = async () => {
    if (outletFilter === 'ALL') {
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const data = await getCustomers(outletFilter);
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setMsg({ type: 'error', text: err.message || 'Gagal memuat data pelanggan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [outletFilter]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', member_type: 'regular' });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      member_type: customer.member_type || 'regular',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (outletFilter === 'ALL') return;

    try {
      if (editingId) {
        await updateCustomer(outletFilter, editingId, form);
        setMsg({ type: 'success', text: 'Data pelanggan berhasil diperbarui!' });
      } else {
        await createCustomer(outletFilter, form);
        setMsg({ type: 'success', text: 'Pelanggan baru berhasil ditambahkan!' });
      }
      setIsCustomerModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menyimpan data pelanggan' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) return;
    try {
      await deleteCustomer(outletFilter, id);
      setMsg({ type: 'success', text: 'Pelanggan berhasil dihapus' });
      loadCustomers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menghapus pelanggan' });
    }
  };

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const history = await getCustomerHistory(outletFilter, customer.id);
      setCustomerHistory(history || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchType = selectedType === 'ALL' || c.member_type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>CRM & Member</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Daftar Pelanggan
          </h1>
          <p className="text-slate-500 text-sm">
            Kelola data pelanggan setia, loyalty poin, dan riwayat transaksi kasir
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            disabled={loading || outletFilter === 'ALL'}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleOpenAdd}
            disabled={outletFilter === 'ALL'}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
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
            Pelanggan terdaftar pada unit usaha yang bersangkutan. Silakan pilih unit usaha spesifik di dropdown atas untuk mengelola pelanggan.
          </p>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau no. telepon..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">Tipe Member:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Member</option>
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Pelanggan</th>
                    <th className="py-4 px-6">No. Telepon</th>
                    <th className="py-4 px-6">Tipe Member</th>
                    <th className="py-4 px-6">Poin Belanja</th>
                    <th className="py-4 px-6">Total Belanja</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        <span>Memuat data pelanggan...</span>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada data pelanggan ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{customer.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {customer.id.slice(0, 8)}...</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                          {customer.phone || '-'}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              customer.member_type === 'vip'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {customer.member_type === 'vip' && <Award className="w-3.5 h-3.5 text-amber-500" />}
                            {customer.member_type}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-teal-600">
                          {customer.points || 0} Pts
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          {formatRupiah(customer.total_spent || '0')}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleViewHistory(customer)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Riwayat Transaksi"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Pelanggan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipe Member
                </label>
                <select
                  value={form.member_type}
                  onChange={(e) =>
                    setForm({ ...form, member_type: e.target.value as 'regular' | 'vip' })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <span>Riwayat Transaksi: {selectedCustomer.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan 50 riwayat transaksi kasir terakhir
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                  <span>Memuat riwayat transaksi...</span>
                </div>
              ) : customerHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  Belum ada catatan riwayat transaksi untuk pelanggan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          Struk #{tx.receipt_number || tx.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(tx.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-teal-600 text-sm">
                          {formatRupiah(tx.grand_total)}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            tx.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
