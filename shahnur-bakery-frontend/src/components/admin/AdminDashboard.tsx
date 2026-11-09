import api from '../../services/api';
import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';

const COLORS = {
  primary: '#D4883B',
  cream: '#FFFAF5',
  creamBorder: '#FFE1C0',
  dark: '#201A14',
  darkMuted: '#7A6A54',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [summary, ordersRes] = await Promise.all([
        api.get('/admin/dashboard/stats'), orderService.getAllOrders({ limit: 10 }),
      ]);
      const overview = summary.data.data.overview;
      setRecentOrders(ordersRes.data || []);
      setPendingOrders((ordersRes.data || []).filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)));
      setStats({ totalOrders: overview.totalOrders, pendingOrders: overview.pendingOrders, totalRevenue: overview.totalRevenue, totalProducts: overview.totalProducts });
    } catch (err) {
      toast.error('Statistikani yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Har 30 sekundda yangilash
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusLabels: any = {
    pending: '⏳ Kutilmoqda',
    confirmed: '✅ Tasdiqlangan',
    preparing: '👨‍🍳 Tayyorlanmoqda',
    ready: '📦 Tayyor',
    out_for_delivery: '🚚 Yetkazilmoqda',
    delivered: '✅ Yetkazilgan',
    cancelled: '❌ Bekor qilingan',
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Umumiy statistika va so'nggi buyurtmalar">
      {/* 🔔 YANGI BUYURTMALAR OGOHLANTIRISHI */}
      {stats.pendingOrders > 0 && (
        <div
          className="rounded-2xl shadow-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-3"
          style={{ backgroundColor: '#FEF3C7', borderLeft: `6px solid ${COLORS.yellow}` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔔</span>
            <div>
              <p className="font-bold" style={{ color: '#92400E' }}>
                {stats.pendingOrders} ta yangi buyurtma!
              </p>
              <p className="text-sm" style={{ color: '#92400E' }}>
                Iltimos, tezda ko'rib chiqing
              </p>
            </div>
          </div>
          <Link
            to="/admin/orders"
            className="px-5 py-2 rounded-lg font-semibold text-white"
            style={{ backgroundColor: COLORS.primary, textDecoration: 'none' }}
          >
            Buyurtmalarni ko'rish →
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-3xl mb-2">📦</div>
          <p className="text-sm mb-1" style={{ color: COLORS.darkMuted }}>
            Jami buyurtmalar
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {stats.totalOrders}
          </p>
        </div>

        <div
          className="rounded-2xl shadow-lg p-5"
          style={{ backgroundColor: stats.pendingOrders > 0 ? '#FEF3C7' : 'white' }}
        >
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-sm mb-1" style={{ color: COLORS.darkMuted }}>
            Kutilayotgan
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.yellow }}>
            {stats.pendingOrders}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-3xl mb-2">💰</div>
          <p className="text-sm mb-1" style={{ color: COLORS.darkMuted }}>
            Umumiy daromad
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.green }}>
            {stats.totalRevenue.toLocaleString()} so'm
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-3xl mb-2">🍰</div>
          <p className="text-sm mb-1" style={{ color: COLORS.darkMuted }}>
            Mahsulotlar
          </p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            {stats.totalProducts}
          </p>
        </div>
      </div>

      {/* ⏳ KUTILAYOTGAN BUYURTMALAR */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: COLORS.dark }}>
            ⏳ Kutilayotgan buyurtmalar ({pendingOrders.length})
          </h2>
          <Link
            to="/admin/orders"
            className="text-sm font-semibold"
            style={{ color: COLORS.primary, textDecoration: 'none' }}
          >
            Barchasini ko'rish →
          </Link>
        </div>

        {loading ? (
          <p className="text-center py-4" style={{ color: COLORS.darkMuted }}>
            Yuklanmoqda...
          </p>
        ) : pendingOrders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-2">✅</div>
            <p style={{ color: COLORS.darkMuted }}>Kutilayotgan buyurtmalar yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div
                key={order._id}
                className="flex flex-wrap gap-3 justify-between items-center p-4 rounded-xl"
                style={{ backgroundColor: '#FEF3C7', borderLeft: `4px solid ${COLORS.yellow}` }}
              >
                <div>
                  <p className="font-bold" style={{ color: COLORS.dark }}>
                    #{order.orderNumber}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                    👤 {order.user?.firstName} {order.user?.lastName} · 📞 {order.user?.phone}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                    🕐 {new Date(order.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: COLORS.primary }}>
                    {order.finalAmount?.toLocaleString()} so'm
                  </p>
                  <span
                    className="inline-block mt-1 px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: COLORS.yellow }}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
                <Link
                  to="/admin/orders"
                  className="px-4 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: COLORS.primary, textDecoration: 'none' }}
                >
                  Ko'rish
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📦 SO'NGGI BUYURTMALAR */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>
          📦 So'nggi buyurtmalar
        </h2>

        {recentOrders.length === 0 ? (
          <p className="text-center py-4" style={{ color: COLORS.darkMuted }}>
            Buyurtmalar yo'q
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: COLORS.cream }}>
                <tr>
                  <th className="text-left p-3 text-sm">Buyurtma</th>
                  <th className="text-left p-3 text-sm">Mijoz</th>
                  <th className="text-left p-3 text-sm">Summa</th>
                  <th className="text-left p-3 text-sm">Holat</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="border-t">
                    <td className="p-3 font-semibold text-sm">#{order.orderNumber}</td>
                    <td className="p-3 text-sm">
                      {order.user?.firstName} {order.user?.lastName}
                    </td>
                    <td className="p-3 text-sm font-semibold" style={{ color: COLORS.primary }}>
                      {order.finalAmount?.toLocaleString()} so'm
                    </td>
                    <td className="p-3 text-sm">{statusLabels[order.status] || order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};