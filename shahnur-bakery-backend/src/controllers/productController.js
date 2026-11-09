const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { category, search, sort, limit = 20, page = 1 } = req.query;

    let query = { isAvailable: true };
    if (req.query.customizable === 'true') query.customizable = true;
    if (req.query.ids !== undefined) {
      if (typeof req.query.ids !== 'string') return res.status(400).json({ success: false, message: 'ID ro‘yxati noto‘g‘ri' });
      const ids = req.query.ids.split(',').filter(Boolean);
      if (ids.length > 100 || ids.some(id => !/^[a-f\d]{24}$/i.test(id))) return res.status(400).json({ success: false, message: 'ID ro‘yxati noto‘g‘ri' });
      query._id = { $in: ids };
    }
    if (req.query.excludeAllergens) {
      if (typeof req.query.excludeAllergens !== 'string') return res.status(400).json({ success: false });
      const excluded = req.query.excludeAllergens.split(',');
      if (excluded.some(a => !require('../services/commercePolicy').allergens.includes(a))) return res.status(400).json({ success: false, message: 'Allergen noto‘g‘ri' });
      query.allergens = { $nin: excluded };
      query.ingredientsVerified = true;
    }
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { nameRu: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc') sortOptions = { price: 1 };
    if (sort === 'price-desc') sortOptions = { price: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .select('-ratings')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

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
      total,
    });
  } catch (error) {
    console.error('❌ getProducts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // ObjectId tekshiruvi
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    // Product'ni olish (populate'siz)
    const product = await Product.findOne({ _id: id, isAvailable: true }).select('-ratings');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    // Views'ni increment qilish
    try {
      product.views = (product.views || 0) + 1;
      await product.save();
    } catch (e) {
      console.log('⚠️ Views increment:', e.message);
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('❌ getProduct error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, images, stock } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Barcha maydonlarni to'ldiring",
      });
    }

    // Rasmlarni formatlash
    let formattedImages = [];
    if (images && Array.isArray(images) && images.length > 0) {
      formattedImages = images.map((img, index) => ({
        url: typeof img === 'string' ? img : img.url,
        publicId: typeof img === 'string' ? '' : (img.publicId || ''),
        isMain: typeof img === 'string' ? index === 0 : (img.isMain || index === 0),
      }));
    }

    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price),
      stock: Number(stock) || 0,
      images: formattedImages,
      averageRating: 0,
      totalReviews: 0,
      views: 0,
      soldCount: 0,
      isAvailable: true,
      ...Object.fromEntries(Object.entries(req.body).filter(([key]) => ['nameRu', 'descriptionRu', 'ingredients', 'allergens', 'ingredientsVerified', 'customizable', 'customPricePerKg', 'lowStockThreshold'].includes(key))),
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Mahsulot muvaffaqiyatli yaratildi',
    });
  } catch (error) {
    console.error('❌ createProduct error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    const allowed = ['name', 'description', 'category', 'price', 'discountPrice', 'images', 'stock', 'isAvailable', 'weight', 'weightUnit', 'nameRu', 'descriptionRu', 'ingredients', 'allergens', 'ingredientsVerified', 'customizable', 'customPricePerKg', 'lowStockThreshold'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    delete updates._id;
    delete updates.__v;

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Mahsulot yangilandi',
    });
  } catch (error) {
    console.error('❌ updateProduct error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    const product = await Product.findByIdAndUpdate(id, { isAvailable: false }, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      message: "Mahsulot o'chirildi",
    });
  } catch (error) {
    console.error('❌ deleteProduct error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Update stock
// @route   PATCH /api/products/:id/stock
// @access  Admin
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    if (!Number.isSafeInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ success: false, message: 'Ombor miqdori manfiy bo‘lmagan butun son bo‘lsin' });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { stock: Number(stock) },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Ombor yangilandi',
    });
  } catch (error) {
    console.error('❌ updateStock error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Upload images (only upload)
// @route   POST /api/products/upload-images
// @access  Admin
const uploadProductImagesOnly = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kamida bitta rasm yuklang',
      });
    }

    const images = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      isMain: index === 0,
    }));

    res.status(200).json({
      success: true,
      data: images,
      message: 'Rasmlar yuklandi',
    });
  } catch (error) {
    console.error('❌ uploadImages error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Upload images (for existing product)
// @route   POST /api/products/:id/images
// @access  Admin
const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rasm yuklang',
      });
    }

    const images = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      isMain: index === 0 && product.images.length === 0,
    }));

    product.images.push(...images);
    await product.save();

    res.status(200).json({
      success: true,
      data: product.images,
      message: 'Rasmlar yuklandi',
    });
  } catch (error) {
    console.error('❌ uploadProductImages error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Admin
const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mahsulot topilmadi',
      });
    }

    product.images = product.images.filter(
      (img) => img._id && img._id.toString() !== imageId
    );
    await product.save();

    res.status(200).json({
      success: true,
      data: product.images,
      message: "Rasm o'chirildi",
    });
  } catch (error) {
    console.error('❌ deleteProductImage error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  uploadProductImagesOnly,
  uploadProductImages,
  deleteProductImage,
};
