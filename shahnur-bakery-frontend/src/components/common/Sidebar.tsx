import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineUsers,
  HiOutlineStar,
  HiOutlineChat,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: HiOutlineHome, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: HiOutlineShoppingBag, label: 'Mahsulotlar', path: '/admin/products' },
    { icon: HiOutlineUsers, label: 'Foydalanuvchilar', path: '/admin/users' },
    { icon: HiOutlineStar, label: 'Sharhlar', path: '/admin/reviews' },
    { icon: HiOutlineChartBar, label: 'Buyurtmalar', path: '/admin/orders' },
    { icon: HiOutlineChat, label: 'Chatlar', path: '/admin/chats' },
    { icon: HiOutlineCog, label: 'Sozlamalar', path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed top-0 left-0 bottom-0 w-72 bg-white shadow-2xl z-50 md:relative md:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-cream-100">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎂</span>
              <div>
                <h2 className="font-display text-xl font-bold gradient-text">
                  Shahnur Bakery
                </h2>
                <p className="text-xs text-dark-400">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-dark-600 hover:bg-cream-50 hover:text-primary-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-8 bg-primary-500 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-cream-100">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <HiOutlineLogout className="w-5 h-5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};