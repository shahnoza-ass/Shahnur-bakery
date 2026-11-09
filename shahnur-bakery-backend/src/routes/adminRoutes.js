const express = require('express');
const router = express.Router();
const { protect, admin, superAdmin } = require('../middleware/auth');
const {
  // Dashboard
  getDashboardStats,
  
  // Users
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActive,
  
  // Products
  getAllProductsAdmin,
  bulkDeleteProducts,
  bulkUpdateStock,
  
  // Orders
  getAllOrdersAdmin,
  updateOrderAdmin,
  bulkUpdateOrderStatus,
  
  // Reviews
  getAllReviewsAdmin,
  approveReview,
  deleteReviewAdmin,
  
  // Analytics
  getSalesAnalytics,
  
  // Export
  exportOrders,
} = require('../controllers/adminController');

const {
  getAllChats,
  assignAdminToChat,
  closeChat,
  deleteMessage,
} = require('../controllers/chatController');

// Dashboard
router.get('/dashboard/stats', protect, admin, getDashboardStats);

// Users
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserById);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, superAdmin, deleteUser);
router.patch('/users/:id/toggle-active', protect, admin, toggleUserActive);

// Products
router.get('/products', protect, admin, getAllProductsAdmin);
router.delete('/products/bulk', protect, admin, bulkDeleteProducts);
router.patch('/products/bulk-stock', protect, admin, bulkUpdateStock);

// Orders
router.get('/orders', protect, admin, getAllOrdersAdmin);
router.put('/orders/:id', protect, admin, updateOrderAdmin);
router.patch('/orders/bulk-status', protect, admin, bulkUpdateOrderStatus);

// Reviews
router.get('/reviews', protect, admin, getAllReviewsAdmin);
router.patch('/reviews/:id/approve', protect, admin, approveReview);
router.delete('/reviews/:id', protect, admin, deleteReviewAdmin);

// Chats (Admin)
router.get('/chats', protect, admin, getAllChats);
router.put('/chats/:chatId/assign', protect, admin, assignAdminToChat);
router.put('/chats/:chatId/close', protect, admin, closeChat);
router.delete('/chats/:chatId/messages/:messageId', protect, admin, deleteMessage);

// Analytics
router.get('/analytics/sales', protect, admin, getSalesAnalytics);

// Export
router.get('/export/orders', protect, admin, exportOrders);

module.exports = router;
