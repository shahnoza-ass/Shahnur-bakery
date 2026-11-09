const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mahsulot nomini kiriting'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Tavsifni kiriting'],
    },
    nameRu: { type: String, maxlength: 200 },
    descriptionRu: { type: String, maxlength: 5000 },
    ingredients: { type: String, maxlength: 2000 },
    allergens: [{ type: String, enum: ['milk', 'eggs', 'nuts', 'gluten', 'soy', 'sesame'] }],
    ingredientsVerified: { type: Boolean, default: false },
    customizable: { type: Boolean, default: false },
    customPricePerKg: { type: Number, min: 1 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    category: {
      type: String,
      required: [true, 'Kategoriyani tanlang'],
      enum: ['tort', 'kek', 'pirojniy', 'cookie', 'bread', 'cake', 'pastry', 'other'],
    },
    price: {
      type: Number,
      required: [true, 'Narxni kiriting'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz'],
      default: 'kg',
    },
    images: [
      {
        url: String,
        publicId: String,
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Miqdorni kiriting'],
      min: 0,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Average rating hisoblash metodi
productSchema.methods.calculateAverageRating = function () {
  if (!this.ratings || this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
    return;
  }
  const total = this.ratings.reduce((acc, item) => acc + item.rating, 0);
  this.averageRating = total / this.ratings.length;
  this.totalReviews = this.ratings.length;
};

// ✅ MODELNI TO'G'RI EKSPORT QILISH
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
