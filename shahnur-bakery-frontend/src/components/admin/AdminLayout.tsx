import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { orderService } from '../../services/orderService';

const COLORS = {
  primary: '#D4883B',
  primaryDark: '#B8702E',
  cream: '#FFFAF5',
  creamBorder: '#FFE1C0',
  dark: '#201A14',
  darkMuted: '#7A6A54',
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
};

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  // Yangi buyurtmalar soni
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewOrder, setHasNewOrder] = useState(false);

  const menuItems = [
    { path: '/admin', label: '📊 Dashboard', exact: true },
    { path: '/admin/products', label: '🍰 Mahsulotlar' },
    { path: '/admin/commerce', label: '📅 Savdo, kalendar, promokodlar' },
    { path: '/admin/orders', label: '📦 Buyurtmalar' },
    { path: '/admin/chats', label: '💬 Chatlar' },
    { path: '/admin/reviews', label: '⭐ Sharhlar' },
    { path: '/admin/messages', label: 'Murojaatlar' },
    { path: '/admin/users', label: '👥 Foydalanuvchilar' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // ==================== BUYURTMALARNI YUKLASH ====================
  const loadPendingOrders = async () => {
    try {
      const res = await orderService.getAllOrders({ limit: 50 });
      const pending = (res.data || []).filter((o: any) =>
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      );
      setPendingOrdersCount(pending.length);
    } catch {
      // Xatolikni yutish
    }
  };

  // Birinchi yuklash
  useEffect(() => {
    loadPendingOrders();
    // Har 30 sekundda yangilash
    const interval = setInterval(loadPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // ==================== SOCKET: YANGI BUYURTMA ====================
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewOrder = (data: any) => {
      console.log('🔔 Yangi buyurtma keldi:', data);

      // Ovoz
      try {
        const audio = new Audio(
          'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
        );
        audio.play().catch(() => {});
      } catch (e) {
        // Ovoz xatolarini yutish
      }

      // Toast xabari
      toast.success(
        `🔔 Yangi buyurtma! #${data.orderNumber} - ${data.finalAmount?.toLocaleString()} so'm`,
        {
          duration: 10000,
          style: {
            background: COLORS.primary,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '15px',
          },
          icon: '🔔',
        }
      );

      // Notification'larni saqlash
      setNotifications((prev) => [
        {
          id: Date.now(),
          orderNumber: data.orderNumber,
          user: data.user,
          amount: data.finalAmount,
          items: data.items,
          createdAt: data.createdAt,
        },
        ...prev.slice(0, 9), // Oxirgi 10 tasini saqlash
      ]);

      // Yangi buyurtma belgisi
      setHasNewOrder(true);

      // Pending count'ni oshirish
      setPendingOrdersCount((prev) => prev + 1);
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, [socket, isConnected]);

  // Notification ko'rilganda belgini o'chirish
  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setHasNewOrder(false);
    }
  };

  // Barcha notification'larni tozalash
  const clearNotifications = () => {
    setNotifications([]);
    setHasNewOrder(false);
  };

  return (
    <div style={{ backgroundColor: COLORS.cream, minHeight: 'calc(100vh - 80px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== TOP BAR ==================== */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: COLORS.primary }}
            >
              👨‍💼
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: COLORS.dark }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs" style={{ color: COLORS.darkMuted }}>
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Socket status */}
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: isConnected ? '#DCFCE7' : '#FEE2E2',
                color: isConnected ? '#166534' : '#991B1B',
              }}
            >
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>

            {/* Pending orders badge */}
            {pendingOrdersCount > 0 && (
              <Link
                to="/admin/orders"
                className="relative px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: COLORS.yellow, textDecoration: 'none' }}
              >
                ⏳ {pendingOrdersCount} kutilayotgan
              </Link>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleOpenNotifications}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Bildirishnomalar"
              >
                🔔
                {notifications.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: hasNewOrder ? COLORS.red : COLORS.primary }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl py-2 z-50"
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  <div
                    className="px-4 py-2 border-b flex justify-between items-center"
                    style={{ borderColor: COLORS.creamBorder }}
                  >
                    <p className="font-bold text-sm" style={{ color: COLORS.dark }}>
                      🔔 Bildirishnomalar
                    </p>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs"
                        style={{ color: COLORS.red }}
                      >
                        Tozalash
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                        Bildirishnomalar yo'q
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        key={notif.id}
                        to="/admin/orders"
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-gray-50 border-b transition-colors"
                        style={{ borderColor: COLORS.creamBorder, textDecoration: 'none' }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-2xl">📦</span>
                          <div className="flex-1">
                            <p className="font-semibold text-sm" style={{ color: COLORS.dark }}>
                              Yangi buyurtma #{notif.orderNumber}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.darkMuted }}>
                              {notif.user?.firstName} {notif.user?.lastName}
                            </p>
                            <p className="text-xs font-semibold" style={{ color: COLORS.primary }}>
                              {notif.amount?.toLocaleString()} so'm
                            </p>
                            <p className="text-xs" style={{ color: COLORS.darkMuted }}>
                              {new Date(notif.createdAt).toLocaleTimeString('uz-UZ', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ==================== SIDEBAR ==================== */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
              <div
                className="mb-4 pb-4 border-b"
                style={{ borderColor: COLORS.creamBorder }}
              >
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: COLORS.darkMuted }}
                >
                  ADMIN PANEL
                </p>
                <p className="font-bold" style={{ color: COLORS.dark }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs" style={{ color: COLORS.darkMuted }}>
                  {user?.email}
                </p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors relative"
                    style={{
                      backgroundColor: isActive(item.path, item.exact)
                        ? COLORS.primary
                        : 'transparent',
                      color: isActive(item.path, item.exact) ? 'white' : COLORS.dark,
                      textDecoration: 'none',
                    }}
                  >
                    {item.label}
                    {/* Buyurtmalar uchun badge */}
                    {item.path === '/admin/orders' && pendingOrdersCount > 0 && (
                      <span
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: COLORS.red }}
                      >
                        {pendingOrdersCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: COLORS.creamBorder }}
              >
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: COLORS.darkMuted, textDecoration: 'none' }}
                >
                  ← Asosiy saytga
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500"
                >
                  🚪 Chiqish
                </button>
              </div>
            </div>
          </aside>

          {/* ==================== CONTENT ==================== */}
          <main className="lg:col-span-4">
            <div className="mb-6">
              <h1
                className="text-3xl font-bold"
                style={{ fontFamily: 'Georgia, serif', color: COLORS.dark }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1" style={{ color: COLORS.darkMuted }}>
                  {subtitle}
                </p>
              )}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
