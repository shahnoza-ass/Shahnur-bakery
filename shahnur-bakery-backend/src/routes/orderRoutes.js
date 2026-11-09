const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/admin/all', protect, admin, getAllOrders);  // ← ADMIN
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);  // ← ADMIN
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;