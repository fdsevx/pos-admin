'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Users,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  Shield,
  Store,
  X,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import { API_BASE_URL, getAuthToken } from '@/lib/api';

export default function UsersPage() {
  const { outletFilter } = useOutlet();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'KASIR',
    outlet_type: 'RESTORAN',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [outletFilter]);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal mendaftarkan kasir');
      }
      setIsModalOpen(false);
      setUserForm({
        username: '',
        password: '',
        full_name: '',
        role: 'KASIR',
        outlet_type: 'RESTORAN',
      });
      loadUsers();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (confirm(`Nonaktifkan akun kasir "${name}"?`)) {
      try {
        const token = getAuthToken();
        await fetch(`${API_BASE_URL}/api/v1/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        loadUsers();
      } catch (err: any) {
        alert(`Gagal: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-slate-600">
              Dasbor
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">Kasir & Staf</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
            Manajemen Akun Kasir & Pengguna
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kasir Baru</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Total Pengguna Terdaftar:{' '}
            <strong className="text-slate-800">{users.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-400 uppercase font-semibold border-b border-slate-100">
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Outlet Ditugaskan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada kasir terdaftar atau sedang memuat...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {u.full_name || u.username}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      @{u.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.outlet_type === 'RESTORAN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {u.outlet_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Aktif
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeactivate(u.id, u.full_name || u.username)}
                          className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          title="Nonaktifkan Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: TAMBAH KASIR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                Daftarkan Akun Kasir Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Kasir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Pratama"
                  value={userForm.full_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, full_name: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username Login *
                </label>
                <input
                  type="text"
                  required
                  placeholder="kasir_cafe_01"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="KASIR">KASIR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Outlet Bertugas *
                  </label>
                  <select
                    value={userForm.outlet_type}
                    onChange={(e) =>
                      setUserForm({ ...userForm, outlet_type: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="RESTORAN">Restoran</option>
                    <option value="CAFE">Cafe</option>
                  </select>
                </div>
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
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
