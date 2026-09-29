'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { useOutlet } from '@/context/OutletContext';
import {
  getUsers,
  createUser,
  resetUserPassword,
  deleteUser,
} from '@/lib/api';

export default function UsersPage() {
  const { outlets } = useOutlet();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add User Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    display_name: '',
    role: 'cashier',
    outlet_ids: [] as string[],
  });

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadUsers = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setMsg({ type: 'error', text: err.message || 'Gagal memuat daftar pegawai' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await createUser({
        username: userForm.username,
        password: userForm.password,
        display_name: userForm.display_name,
        role: userForm.role,
        outlet_ids: userForm.outlet_ids.length > 0 ? userForm.outlet_ids : undefined,
      });
      setMsg({ type: 'success', text: `Pegawai "${userForm.display_name}" berhasil didaftarkan!` });
      setIsModalOpen(false);
      setUserForm({
        username: '',
        password: '',
        display_name: '',
        role: 'cashier',
        outlet_ids: [],
      });
      loadUsers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menambahkan pegawai' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReset = (user: any) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPassword) return;
    setSubmitting(true);
    try {
      await resetUserPassword(selectedUserForReset.id, newPassword);
      setMsg({
        type: 'success',
        text: `Password untuk "${selectedUserForReset.display_name}" berhasil direset!`,
      });
      setIsResetModalOpen(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal mereset kata sandi' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Hapus akun pegawai "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteUser(id);
      setMsg({ type: 'success', text: `Akun pegawai "${name}" berhasil dihapus` });
      loadUsers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal menghapus pegawai' });
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = u.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const usernameMatch = u.username?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || usernameMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Hak Akses & Pegawai</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manajemen Pegawai & Kasir
          </h1>
          <p className="text-slate-500 text-sm">
            Daftarkan staf kasir, atur role (super_admin, cashier, manager), dan reset kata sandi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai Baru</span>
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

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama atau username..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Total: {filteredUsers.length} Pegawai
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Nama Pegawai</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Role / Hak Akses</th>
                <th className="py-4 px-6">Status Akun</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                    <span>Memuat data pegawai...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada pegawai ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{u.display_name || u.username}</div>
                      <div className="text-[11px] text-slate-400">ID: {u.id?.slice(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      @{u.username}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : u.role === 'manager'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.is_active !== false && u.is_active !== 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.is_active !== false && u.is_active !== 0 ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenReset(u)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Ganti / Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.display_name || u.username)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Pegawai"
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

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Pegawai Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={userForm.display_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, display_name: e.target.value })
                  }
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username (Untuk Login)
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })
                  }
                  placeholder="Contoh: siti_kasir"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role / Posisi Jabatan
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="cashier">Kasir (Cashier)</option>
                  <option value="manager">Manajer Outlet</option>
                  <option value="accountant">Akuntan (Keuangan)</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {outlets && outlets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Akses Outlet (Cabang)
                  </label>
                  <select
                    onChange={(e) => {
                      const id = e.target.value;
                      if (id && !userForm.outlet_ids.includes(id)) {
                        setUserForm({ ...userForm, outlet_ids: [...userForm.outlet_ids, id] });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="">-- Pilih Cabang yang Diizinkan --</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {userForm.outlet_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {userForm.outlet_ids.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg border border-teal-200"
                        >
                          {outlets.find((o) => o.id === id)?.name || id}
                          <button
                            type="button"
                            onClick={() =>
                              setUserForm({
                                ...userForm,
                                outlet_ids: userForm.outlet_ids.filter((oid) => oid !== id),
                              })
                            }
                            className="text-teal-500 hover:text-teal-800"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Daftarkan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                Reset Kata Sandi
              </h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ganti password untuk pegawai <strong>{selectedUserForReset.display_name}</strong> (@{selectedUserForReset.username}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || newPassword.length < 6}
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Ubah Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
