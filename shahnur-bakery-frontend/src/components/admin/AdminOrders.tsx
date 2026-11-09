import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import { orderService } from '../../services/orderService';

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

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Kutilmoqda', color: '#F59E0B' },
  { value: 'confirmed', label: '✅ Tasdiqlangan', color: '#3B82F6' },
  { value: 'preparing', label: '👨‍🍳 Tayyorlanmoqda', color: '#8B5CF6' },
  { value: 'ready', label: '📦 Tayyor', color: '#10B981' },
  { value: 'out_for_delivery', label: '🚚 Yetkazilmoqda', color: '#06B6D4' },
  { value: 'delivered', label: '✅ Yetkazilgan', color: '#10B981' },
  { value: 'cancelled', label: '❌ Bekor qilingan', color: '#EF4444' },
];

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    try {
      const res = await orderService.getAllOrders();
      setOrders(res.data || []);
    } catch {
      toast.error("Buyurtmalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Har 30 sekundda yangilash
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await orderService.updateOrderStatus(id, status);
      toast.success('Status yangilandi');
      loadOrders();
      if (selected?._id === id) {
        setSelected({ ...selected, status });
      }
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  let filtered = orders;
  if (filter !== 'all') filtered = filtered.filter((o) => o.status === filter);
  if (search)
    filtered = filtered.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        `${o.user?.firstName} ${o.user?.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
    );

  const getStatusColor = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color || COLORS.darkMuted;

  return (
    <AdminLayout title="Buyurtmalar" subtitle="Buyurtmalarni boshqarish va statuslarini o'zgartirish">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 space-y-3">
        <input
          type="text"
          placeholder="🔍 Buyurtma raqami yoki mijoz nomi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 outline-none"
          style={{ borderColor: COLORS.creamBorder }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className="px-3 py-1 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: filter === 'all' ? COLORS.primary : COLORS.cream,
              color: filter === 'all' ? 'white' : COLORS.primary,
            }}
          >
            Barchasi ({orders.length})
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className="px-3 py-1 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: filter === s.value ? s.color : COLORS.cream,
                color: filter === s.value ? 'white' : COLORS.primary,
              }}
            >
              {s.label} ({orders.filter((o) => o.status === s.value).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p style={{ color: COLORS.darkMuted }}>Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p style={{ color: COLORS.darkMuted }}>Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl shadow-lg p-4">
              {/* Header */}
              <div className="flex flex-wrap gap-3 justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold" style={{ color: COLORS.dark }}>
                    #{order.orderNumber}
                  </h3>
                  <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                    {new Date(order.createdAt).toLocaleString('uz-UZ')}
                  </p>
                  <p className="text-sm">
                    👤 {order.user?.firstName} {order.user?.lastName} · 📞 {order.user?.phone}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                    📍 {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                  </p>
                  <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                    🕐 Yetkazib berish: {order.deliveryTime} · {new Date(order.deliveryDate).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: COLORS.primary }}>
                    {order.finalAmount?.toLocaleString()} so'm
                  </p>
                  <span
                    className="inline-block mt-1 px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === order.status)?.label}
                  </span>
                  <p className="text-xs mt-1" style={{ color: COLORS.darkMuted }}>
                    💳 {order.paymentMethod}
                  </p>
                </div>
              </div>

              {/* ==================== MAHSULOTLAR RO'YXATI ==================== */}
              <div
                className="rounded-xl p-3 mb-3"
                style={{ backgroundColor: COLORS.cream }}
              >
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.darkMuted }}>
                  📦 MAHSULOTLAR ({order.items?.length || 0} ta)
                </p>
                <div className="space-y-2">
                  {order.items?.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-white p-2 rounded-lg"
                    >
                      {/* Mahsulot rasmi */}
                      {item.product?.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: COLORS.cream }}
                        >
                          🍰
                        </div>
                      )}

                      {/* Mahsulot ma'lumotlari */}
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: COLORS.dark }}>
                          {item.name}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.darkMuted }}>
                          {item.price?.toLocaleString()} so'm × {item.quantity}
                        </p>
                      </div>

                      {/* Jami */}
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: COLORS.primary }}>
                          {item.total?.toLocaleString()} so'm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Jami summa */}
                <div
                  className="flex justify-between mt-3 pt-3"
                  style={{ borderTop: `1px solid ${COLORS.creamBorder}` }}
                >
                  <span className="font-bold text-sm">Jami:</span>
                  <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
                    {order.finalAmount?.toLocaleString()} so'm
                  </span>
                </div>

                {/* Qo'shimcha izoh */}
                {order.specialRequests && (
                  <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                    <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
                      💬 Izoh: {order.specialRequests}
                    </p>
                  </div>
                )}
              </div>

              {/* Status tugmalari */}
              <div className="flex flex-wrap gap-2 mb-3">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleUpdateStatus(order._id, s.value)}
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: order.status === s.value ? s.color : COLORS.cream,
                      color: order.status === s.value ? 'white' : COLORS.primary,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Batafsil */}
              <button
                onClick={() => setSelected(order)}
                className="text-sm font-semibold"
                style={{ color: COLORS.primary }}
              >
                Batafsil ko'rish →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ==================== ORDER DETAIL MODAL ==================== */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold" style={{ color: COLORS.dark }}>
                Buyurtma #{selected.orderNumber}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-2xl"
                style={{ color: COLORS.darkMuted }}
              >
                ×
              </button>
            </div>

            {/* Mijoz va manzil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.cream }}>
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.darkMuted }}>
                  👤 MIJOZ
                </p>
                <p className="font-semibold">
                  {selected.user?.firstName} {selected.user?.lastName}
                </p>
                <p className="text-sm">📞 {selected.user?.phone}</p>
                <p className="text-sm">✉️ {selected.user?.email}</p>
              </div>

              <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.cream }}>
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.darkMuted }}>
                  📍 YETKAZIB BERISH
                </p>
                <p className="text-sm">
                  {selected.deliveryAddress?.street}, {selected.deliveryAddress?.city}
                </p>
                {selected.deliveryAddress?.district && (
                  <p className="text-sm">{selected.deliveryAddress.district} tumani</p>
                )}
                <p className="text-sm mt-2">
                  🕐 {selected.deliveryTime} ·{' '}
                  {new Date(selected.deliveryDate).toLocaleDateString('uz-UZ')}
                </p>
                <p className="text-sm">💳 {selected.paymentMethod}</p>
              </div>
            </div>

            {/* Mahsulotlar */}
            {selected.gift?.enabled && <div className="commerce-panel"><h3>Sovg‘a / Подарок</h3><p>{selected.gift.recipient} · {selected.gift.phone}</p><p>{selected.gift.message}</p><p>{selected.gift.packaging}</p></div>}
            {selected.items?.filter((i: any) => i.customization?.weight).map((i: any, index: number) => <div className="commerce-panel" key={index}><b>{i.name} · {i.customization.weight} kg</b><p>{i.customization.flavor} / {i.customization.cream} / {i.customization.decoration}</p><p>{i.customization.inscription}</p></div>)}
            <h3 className="font-bold mb-2" style={{ color: COLORS.dark }}>
              📦 Mahsulotlar ({selected.items?.length || 0} ta)
            </h3>
            <div className="space-y-2 mb-4">
              {selected.items?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: COLORS.cream }}
                >
                  {item.product?.images?.[0]?.url ? (
                    <img
                      src={item.product.images[0].url}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: 'white' }}
                    >
                      🍰
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                      {item.price?.toLocaleString()} so'm × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold" style={{ color: COLORS.primary }}>
                    {item.total?.toLocaleString()} so'm
                  </p>
                </div>
              ))}
            </div>

            {/* Jami */}
            <div
              className="flex justify-between p-4 rounded-xl mb-4"
              style={{ backgroundColor: COLORS.primary, color: 'white' }}
            >
              <span className="font-bold text-lg">JAMI:</span>
              <span className="font-bold text-2xl">
                {selected.finalAmount?.toLocaleString()} so'm
              </span>
            </div>

            {/* Izoh */}
            {selected.specialRequests && (
              <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                  💬 Izoh: {selected.specialRequests}
                </p>
              </div>
            )}

            {/* Status o'zgartirish */}
            <h3 className="font-bold mb-2" style={{ color: COLORS.dark }}>
              🔄 Status o'zgartirish
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleUpdateStatus(selected._id, s.value)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: selected.status === s.value ? s.color : COLORS.cream,
                    color: selected.status === s.value ? 'white' : COLORS.primary,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: COLORS.primary }}
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
