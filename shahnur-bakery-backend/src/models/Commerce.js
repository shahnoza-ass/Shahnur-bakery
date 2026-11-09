const mongoose = require('mongoose');
const { Schema } = mongoose;
const Promo = mongoose.model('Promo', new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  percent: { type: Number, required: true, min: 1, max: 50 },
  minAmount: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
  limit: { type: Number, default: 100, min: 1 },
  used: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true }));
const Slot = mongoose.model('DeliverySlot', new Schema({ _id: String, date: String, time: String, count: { type: Number, default: 0, min: 0 } }));
const Payment = mongoose.model('Payment', new Schema({
  provider: { type: String, enum: ['payme', 'click'], required: true },
  externalId: { type: String, required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true },
  state: { type: Number, default: 1 },
  providerTime: Number, createTime: Number, performTime: { type: Number, default: 0 }, cancelTime: { type: Number, default: 0 }, reason: Number,
  prepareId: Number,
}));
Payment.schema.index({ provider: 1, externalId: 1 }, { unique: true });
const Counter = mongoose.model('CommerceCounter', new Schema({ _id: String, value: { type: Number, default: 0 } }));
module.exports = { Promo, Slot, Payment, Counter };
