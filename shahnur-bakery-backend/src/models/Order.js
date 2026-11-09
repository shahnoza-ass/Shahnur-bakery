const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    idempotencyKey: { type: String, maxlength: 100 },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
        customization: { weight: Number, flavor: String, cream: String, decoration: String, inscription: String },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
    actualDeliveryTime: Date,
    totalAmount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    promoCode: String,
    promoDiscount: { type: Number, default: 0 },
    bonusUsed: { type: Number, default: 0 },
    bonusEarned: { type: Number, default: 0 },
    bonusCredited: { type: Boolean, default: false },
    slotKey: String,
    gift: { enabled: Boolean, recipient: String, phone: String, message: String, packaging: String },
    deliveryFee: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: String,
      zipCode: String,
      country: { type: String, default: 'Uzbekistan' },
      additionalInfo: String,
    },
    deliveryDate: { type: Date, required: true },
    deliveryTime: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'payme', 'click', 'uzum'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    activePayment: String,
    specialRequests: String,
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// ✅ OrderNumber AVTOMATIK yaratish
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
module.exports = mongoose.model('Order', orderSchema);
