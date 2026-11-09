const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri mahsulot ID',
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'items.product': productId,
      status: 'delivered',
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Faqat sotib olingan mahsulotlarga sharh qoldirish mumkin',
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Siz bu mahsulotga allaqachon sharh qoldirgansiz',
      });
    }

    // Create review
    const review = await Review.create({
      user: req.user.id,
      product: productId,
      order: hasPurchased._id,
      rating: Number(rating),
      title,
      comment,
      images: images || [],
      isVerifiedPurchase: true,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Sharh qoldirildi',
    });
  } catch (error) {
    console.error('❌ createReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Get reviews for product
// @route   GET /api/reviews/product/:productId
// @access  Private
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // ObjectId tekshiruvi — fallback ID lar uchun BO'SH massiv qaytaramiz
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('⚠️ Noto\'g\'ri ObjectId:', productId, '- bo\'sh massiv qaytaramiz');
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    }

    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ product: productId, isApproved: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'firstName lastName profileImage');

    const total = await Review.countDocuments({
      product: productId,
      isApproved: true,
    });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ getProductReviews error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Get my reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('product', 'name images category');

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('❌ getMyReviews error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    let review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Ruxsat berilmagan',
      });
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Sharh yangilandi',
    });
  } catch (error) {
    console.error('❌ updateReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    if (
      review.user.toString() !== req.user.id &&
      !['admin', 'superadmin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Ruxsat berilmagan',
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: "Sharh o'chirildi",
    });
  } catch (error) {
    console.error('❌ deleteReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Admin respond to review
// @route   POST /api/reviews/:id/respond
// @access  Admin
const respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Sharh topilmadi',
      });
    }

    review.adminResponse = {
      message,
      respondedBy: req.user.id,
      respondedAt: new Date(),
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: "Javob qo'shildi",
    });
  } catch (error) {
    console.error('❌ respondToReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  respondToReview,
};