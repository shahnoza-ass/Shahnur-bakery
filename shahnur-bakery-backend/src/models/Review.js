const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    adminResponse: {
      message: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Faqat bitta review bo'lishi uchun indeks
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

async function refreshRating(product) {
  const [stats] = await mongoose.model('Review').aggregate([
    { $match: { product, isApproved: true } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);
  await mongoose.model('Product').updateOne({ _id: product }, { $set: { averageRating: stats?.averageRating || 0, totalReviews: stats?.totalReviews || 0 } });
}
reviewSchema.post('save', async function(doc) { await refreshRating(doc.product); });
reviewSchema.post('deleteOne', { document: true, query: false }, async function() { await refreshRating(this.product); });
module.exports = mongoose.model('Review', reviewSchema);