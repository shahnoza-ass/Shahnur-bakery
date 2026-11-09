const workflow = require('../services/orderWorkflow');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Chat = require('../models/Chat');
const { sendEmail } = require('../services/emailService');
const NotificationService = require('../services/notificationService');

// ==================== DASHBOARD STATISTIKA ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Umumiy statistika
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Daromad statistikasi
    const revenueStats = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    
    // Kunlik, haftalik, oylik daromad
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'day') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }
    
    const periodRevenue = await Order.aggregate([
      { $match: { status: 'delivered', ...dateFilter } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
        },
      },
    ]);
    
    // Oylik daromad grafigi uchun
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$finalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);
    
    // Eng ko'p sotilgan mahsulotlar
    const topProducts = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          productImage: { $arrayElemAt: ['$product.images.url', 0] },
          totalSold: 1,
          totalRevenue: 1,
        },
      },
    ]);
    
    // Kategoriya bo'yicha sotuvlar
    const categorySales = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalSold: -1 } },
    ]);
    
    // Status bo'yicha buyurtmalar
    const orderStatusCount = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Yangi foydalanuvchilar (oxirgi 7 kun)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: lastWeek },
    });
    
    // Kutilayotgan buyurtmalar
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed', 'preparing'] },
    });
    
    // Kutilayotgan reviewlar
    const pendingReviews = await Review.countDocuments({
      isApproved: false,
    });
    
    // Kutilayotgan foydalanuvchilar
    const pendingUsers = await User.countDocuments({
      status: 'pending',
    });
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalReviews,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
          pendingOrders,
          pendingReviews,
          pendingUsers,
          newUsers,
        },
        periodStats: {
          revenue: periodRevenue[0]?.revenue || 0,
          orders: periodRevenue[0]?.orders || 0,
          period,
        },
        monthlyRevenue,
        topProducts,
        categorySales,
        orderStatusCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== FOYDALANUVCHILARNI BOSHQARISH ====================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { 
      search, 
      role, 
      status, 
      isActive,
      limit = 20, 
      page = 1,
      sort = '-createdAt',
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort qilish
    let sortOptions = {};
    if (sort.startsWith('-')) {
      sortOptions[sort.substring(1)] = -1;
    } else {
      sortOptions[sort] = 1;
    }

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('wishlist')
      .populate('cart.product');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Foydalanuvchining buyurtmalari
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        user,
        orders,
        totalOrders: await Order.countDocuments({ user: user._id }),
        totalSpent: await Order.aggregate([
          { $match: { user: user._id, status: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$finalAmount' } } },
        ]),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      status, 
      isActive,
      address,
      profileImage,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    if (req.user.role !== 'superadmin' && (role !== undefined || user.role !== 'user')) {
      return res.status(403).json({ success: false, message: 'Bu amal uchun superadmin ruxsati kerak' });
    }
    if (req.user.id === user.id && (isActive === false || (role && role !== user.role))) {
      return res.status(400).json({ success: false, message: 'O‘z hisobingiz vakolatini o‘zgartira olmaysiz' });
    }
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (isActive !== undefined) user.isActive = isActive;
    if (address) user.address = address;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    // Notification
    if (status === 'approved') {
      await sendEmail(
        user.email,
        'Shahnur Bakery - Akkauntingiz tasdiqlandi! 🎉',
        `
          <h2>Hurmatli ${user.firstName},</h2>
          <p>Akkauntingiz muvaffaqiyatli tasdiqlandi!</p>
          <p>Endi siz Shahnur Bakery'ning barcha mahsulotlarini ko'rishingiz va buyurtma berishingiz mumkin.</p>
          <a href="${process.env.FRONTEND_URL}/login">Tizimga kirish</a>
        `
      );
    }

    if (status === 'rejected') {
      await sendEmail(
        user.email,
        'Shahnur Bakery - Akkauntingiz rad etildi',
        `
          <h2>Hurmatli ${user.firstName},</h2>
          <p>Kechirasiz, akkauntingiz rad etildi.</p>
          <p>Qo'shimcha ma'lumot uchun admin bilan bog'laning.</p>
        `
      );
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Foydalanuvchi muvaffaqiyatli yangilandi',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Super Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    // Super adminni o'chirish mumkin emas
    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Super adminni o\'chirish mumkin emas',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Foydalanuvchi o\'chirildi',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-active
// @access  Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin statusini o\'zgartirish mumkin emas',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    const message = user.isActive 
      ? 'Foydalanuvchi faollashtirildi' 
      : 'Foydalanuvchi bloklandi';

    res.status(200).json({
      success: true,
      data: user,
      message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== MAHSULOTLARNI BOSHQARISH ====================

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const {
      search,
      category,
      isAvailable,
      minPrice,
      maxPrice,
      lowStock,
      limit = 20,
      page = 1,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (lowStock === 'true') {
      query.$or = [
        { stock: { $lte: 5 } },
        { stock: 0 },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOptions = {};
    if (sort.startsWith('-')) {
      sortOptions[sort.substring(1)] = -1;
    } else {
      sortOptions[sort] = 1;
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('ratings.user', 'firstName lastName');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Bulk delete products
// @route   DELETE /api/admin/products/bulk
// @access  Admin
const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Iltimos mahsulot ID larini yuboring',
      });
    }

    const result = await Product.updateMany({ _id: { $in: productIds } }, { isAvailable: false });
    result.deletedCount = result.modifiedCount;

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} ta mahsulot o'chirildi`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Bulk update product stock
// @route   PATCH /api/admin/products/bulk-stock
// @access  Admin
const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Iltimos yangilanishlar ro\'yxatini yuboring',
      });
    }

    const results = [];
    for (const update of updates) {
      const { productId, stock } = update;
      const product = await Product.findByIdAndUpdate(
        productId,
        { stock: Number(stock) },
        { new: true, runValidators: true }
      );
      if (product) {
        results.push({
          id: product._id,
          name: product.name,
          stock: product.stock,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `${results.length} ta mahsulot yangilandi`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== BUYURTMALARNI BOSHQARISH ====================

// @desc    Get all orders with filters (admin)
// @route   GET /api/admin/orders
// @access  Admin
const getAllOrdersAdmin = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      limit = 20,
      page = 1,
      sort = '-createdAt',
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      query.finalAmount = {};
      if (minAmount) query.finalAmount.$gte = Number(minAmount);
      if (maxAmount) query.finalAmount.$lte = Number(maxAmount);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOptions = {};
    if (sort.startsWith('-')) {
      sortOptions[sort.substring(1)] = -1;
    } else {
      sortOptions[sort] = 1;
    }

    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName email phone');

    const total = await Order.countDocuments(query);

    // Statistikani hisoblash
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      stats: stats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Update order (admin)
// @route   PUT /api/admin/orders/:id
// @access  Admin
const updateOrderAdmin = async (req, res) => {
  try {
    const order = await workflow.changeOrder(req.params.id, req.body, req.user);
    const io = req.app.get('io');
    if (io) io.to('user_' + order.user).to('admins').emit('order_status_updated', { orderId: order.id, status: order.status });
    res.json({ success: true, data: order, message: 'Buyurtma yangilandi' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Buyurtmani yangilashda xatolik' });
  }
};

const bulkUpdateOrderStatus = async (req, res) => {
  const { orderIds, status, note } = req.body;
  if (!Array.isArray(orderIds) || !orderIds.length || orderIds.length > 100 || !status) {
    return res.status(400).json({ success: false, message: 'Buyurtmalar ro‘yxati yoki holati noto?g‘ri' });
  }
  const results = [];
  for (const id of [...new Set(orderIds)]) {
    try {
      const order = await workflow.changeOrder(id, { status, note }, req.user);
      results.push({ id, status: order.status, success: true });
    } catch (error) {
      results.push({ id, success: false, message: error.status ? error.message : 'Yangilashda xatolik' });
    }
  }
  res.json({ success: true, data: results });
};

// ==================== SHARHLARNI BOSHQARISH ====================

// @desc    Get all reviews (admin)
// @route   GET /api/admin/reviews
// @access  Admin
const getAllReviewsAdmin = async (req, res) => {
  try {
    const {
      isApproved,
      rating,
      search,
      limit = 20,
      page = 1,
      sort = '-createdAt',
    } = req.query;

    const query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (rating) query.rating = Number(rating);

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortOptions = {};
    if (sort.startsWith('-')) {
      sortOptions[sort.substring(1)] = -1;
    } else {
      sortOptions[sort] = 1;
    }

    const reviews = await Review.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName email profileImage')
      .populate('product', 'name images category');

    const total = await Review.countDocuments(query);

    // Rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      ratingDistribution,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Approve/Reject review
// @route   PATCH /api/admin/reviews/:id/approve
// @access  Admin
const approveReview = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const review = await Review.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    review.isApproved = isApproved;
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: isApproved ? 'Sharh tasdiqlandi' : 'Sharh rad etildi',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Admin
const deleteReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    // Remove from product
    const product = await Product.findById(review.product);
    if (product) {
      product.ratings = product.ratings.filter(
        (r) => r.user.toString() !== review.user.toString()
      );
      product.calculateAverageRating();
      await product.save();
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Sharh o\'chirildi',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== ANALYTICS ====================

// @desc    Get sales analytics
// @route   GET /api/admin/analytics/sales
// @access  Admin
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (year && month) {
      dateFilter = {
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1),
        },
      };
    } else if (period === 'day') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    // Kunlik sotuvlar
    const dailySales = await Order.aggregate([
      { $match: { status: 'delivered', ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          total: { $sum: '$finalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Soatlik sotuvlar
    const hourlySales = await Order.aggregate([
      { $match: { status: 'delivered', ...dateFilter } },
      {
        $group: {
          _id: { hour: { $hour: '$createdAt' } },
          total: { $sum: '$finalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.hour': 1 } },
    ]);

    // Mahsulot tahlili
    const productAnalytics = await Order.aggregate([
      { $match: { status: 'delivered', ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          averagePrice: { $avg: '$items.price' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          totalSold: 1,
          totalRevenue: 1,
          averagePrice: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailySales,
        hourlySales,
        productAnalytics,
        period,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

// ==================== EKSPORT FUNKSIYALARI ====================

// @desc    Export orders as CSV
// @route   GET /api/admin/export/orders
// @access  Admin
const exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    // CSV yaratish
    const csvRows = [];
    const headers = [
      'Order Number',
      'Customer',
      'Email',
      'Phone',
      'Items',
      'Total Amount',
      'Status',
      'Payment Method',
      'Payment Status',
      'Created At',
      'Delivery Address',
    ];
    csvRows.push(headers.join(','));

    for (const order of orders) {
      const row = [
        order.orderNumber,
        `${order.user.firstName} ${order.user.lastName}`,
        order.user.email,
        order.user.phone,
        order.items.map(item => `${item.name} x${item.quantity}`).join('; '),
        order.finalAmount,
        order.status,
        order.paymentMethod,
        order.paymentStatus,
        new Date(order.createdAt).toISOString(),
        `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`,
      ];
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    res.status(200).send(csvRows.join('\n'));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: error.message,
    });
  }
};

module.exports = {
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
};