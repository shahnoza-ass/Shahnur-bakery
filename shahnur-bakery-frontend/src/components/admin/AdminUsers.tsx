import { useAuth } from '../../hooks/useAuth';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import api from '../../services/api';

const COLORS = {
  primary: '#D4883B',
  cream: '#FFFAF5',
  creamBorder: '#FFE1C0',
  dark: '#201A14',
  darkMuted: '#7A6A54',
  green: '#10B981',
  red: '#EF4444',
};

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/users', { params: { limit: 100 } });
        setUsers(res.data.data || []);
      } catch {
        toast.error('Foydalanuvchilarni yuklab bo\'lmadi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/admin/users/${id}`, { status });
      setUsers((p) => p.map((u) => (u._id === id ? { ...u, status } : u)));
      toast.success('Status yangilandi');
    } catch {
      toast.error('Xatolik');
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await api.put(`/admin/users/${id}`, { role });
      setUsers((p) => p.map((u) => (u._id === id ? { ...u, role } : u)));
      toast.success('Rol yangilandi');
    } catch {
      toast.error('Xatolik');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Foydalanuvchilar" subtitle="Foydalanuvchilarni boshqarish">
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 outline-none"
          style={{ borderColor: COLORS.creamBorder }}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p style={{ color: COLORS.darkMuted }}>Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: COLORS.cream }}>
              <tr>
                <th className="text-left p-3 text-sm">Foydalanuvchi</th>
                <th className="text-left p-3 text-sm">Email</th>
                <th className="text-left p-3 text-sm">Telefon</th>
                <th className="text-left p-3 text-sm">Rol</th>
                <th className="text-left p-3 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        {u.firstName?.[0]}
                        {u.lastName?.[0]}
                      </div>
                      <span className="font-semibold text-sm">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{u.email}</td>
                  <td className="p-3 text-sm">{u.phone}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={currentUser?.role !== 'superadmin' || u._id === currentUser?._id}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="px-2 py-1 rounded border-2 text-sm outline-none"
                      style={{ borderColor: COLORS.creamBorder }}
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">👨‍💼 Admin</option>
                      <option value="superadmin">👑 Super Admin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.status}
                      onChange={(e) => handleStatusChange(u._id, e.target.value)}
                      className="px-2 py-1 rounded border-2 text-sm outline-none"
                      style={{ borderColor: COLORS.creamBorder }}
                    >
                      <option value="pending">⏳ Kutilmoqda</option>
                      <option value="approved">✅ Tasdiqlangan</option>
                      <option value="rejected">❌ Rad etilgan</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};