const workflow = require('../services/orderWorkflow');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const NotificationService = require('../services/notificationService');

// ==================== YORDAMCHI FUNKSIYALAR ====================

// Order raqamini yaratish
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

// Admin'ga real-time xabar yuborish
const notifyAdmins = (io, order) => {
  if (!io) {
    console.log('⚠️ Socket.io mavjud emas');
    return;
  }

  const notificationData = {
    _id: order._id,
    orderNumber: order.orderNumber,
    user: {
      firstName: order.user?.firstName || 'Noma\'lum',
      lastName: order.user?.lastName || '',
      phone: order.user?.phone || '',
    },
    finalAmount: order.finalAmount,
    items: order.items?.length || 0,
    status: order.status,
    createdAt: order.createdAt,
  };

  // Barcha admin va superadmin'larga yuborish
  io.to('admins').emit('new_order', notificationData);

  console.log('📢 Admin\'ga yangi buyurtma xabari yuborildi:', order.orderNumber);
};

// ==================== ASOSIY CONTROLLERLAR ====================

// @desc    Create order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const order = await workflow.createOrder(req.body, req.user.id);
    await order.populate('user', 'firstName lastName email phone');
    if (order.$locals.checkoutCreated) {
      notifyAdmins(req.app.get('io'), order);
      NotificationService.notifyNewOrder(order, order.user).catch(error => console.error('Notification failed:', error.message));
    }
    res.status(201).json({ success: true, data: order, message: 'Buyurtma qabul qilindi' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Buyurtmani saqlashda xatolik yuz berdi' });
  }
};

// @desc    Get all orders (user)
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.product', 'name images category');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ getMyOrders error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    const order = await Order.findById(id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Buyurtma topilmadi',
      });
    }

    // Ruxsat tekshiruvi
    if (
      order.user._id.toString() !== req.user.id &&
      !['admin', 'superadmin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Ruxsat berilmagan',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('❌ getOrder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const respondToChange = async (req, res, changes) => {
  try {
    const order = await workflow.changeOrder(req.params.id, changes, req.user);
    const io = req.app.get('io');
    if (io) {
      const payload = { orderId: order._id, orderNumber: order.orderNumber, status: order.status };
      io.to('user_' + order.user).to('admins').emit('order_status_updated', payload);
    }
    res.json({ success: true, data: order, message: 'Buyurtma yangilandi' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Buyurtmani yangilashda xatolik' });
  }
};
const updateOrderStatus = (req, res) => respondToChange(req, res, { status: req.body.status, note: req.body.note });
const cancelOrder = (req, res) => respondToChange(req, res, { status: 'cancelled', note: 'Mijoz tomonidan bekor qilindi' });

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Admin
const getAllOrders = async (req, res) => {
  try {
    const { status, search, limit = 20, page = 1 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images category');

    const total = await Order.countDocuments(query);

    // Statistika
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Status bo'yicha statistika
    const statusStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      stats: stats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0,
        count: 0,
      },
      statusStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ getAllOrders error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Get order statistics (admin)
// @route   GET /api/orders/admin/stats
// @access  Admin
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed', 'preparing'] },
    });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    const revenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' },
          average: { $avg: '$finalAmount' },
        },
      },
    ]);

    // Kunlik buyurtmalar (oxirgi 7 kun)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: revenue[0]?.total || 0,
        averageOrderValue: revenue[0]?.average || 0,
        dailyOrders,
      },
    });
  } catch (error) {
    console.error('❌ getOrderStats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderStats,
};
