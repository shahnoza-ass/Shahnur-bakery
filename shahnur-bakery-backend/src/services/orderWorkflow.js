const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { Promo, Slot } = require('../models/Commerce');
const policy = require('./commercePolicy');

const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const isId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

// MongoDB driver versions differ in whether withTransaction returns the callback
// result or the commit response. Return only the successfully committed result.
async function transaction(fn) {
  let result;
  await mongoose.connection.transaction(async session => { result = await fn(session); });
  return result;
}

function validateOrder(data) {
  if (data.idempotencyKey !== undefined && (typeof data.idempotencyKey !== 'string' || !/^[a-z\d-]{16,100}$/i.test(data.idempotencyKey))) {
    throw fail('Buyurtma kaliti noto‘g‘ri');
  }
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100) {
    throw fail('Savatchada 1 tadan 100 tagacha mahsulot bo‘lishi kerak');
  }
  if (data.discount !== undefined && Number(data.discount) !== 0) {
    throw fail('Chegirmani faqat server belgilaydi');
  }
  const items = new Map();
  const configurations = new Map();
  for (const item of data.items) {
    if (!item || !isId(item.product) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) {
      throw fail('Mahsulot ID yoki miqdori noto‘g‘ri');
    }
    const config = policy.customization(item.customization);
    const key = config ? `${item.product}#${JSON.stringify(config)}` : item.product;
    const quantity = (items.get(key) || 0) + item.quantity;
    if (quantity > 1000) throw fail('Mahsulot miqdori 1000 tadan oshmasligi kerak');
    items.set(key, quantity);
    if (config) configurations.set(key, config);
  }
  const address = data.deliveryAddress;
  if (!address || !['street', 'city'].every(key => typeof address[key] === 'string' && address[key].trim().length > 1 && address[key].length <= 200)) {
    throw fail('Yetkazib berish manzilini to‘ldiring');
  }
  const date = new Date(data.deliveryDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!Number.isFinite(date.getTime()) || date < today || date > new Date(Date.now() + 90 * 86400000)) {
    throw fail('Yetkazib berish sanasi kelgusi 90 kun ichida bo‘lishi kerak');
  }
  if (typeof data.deliveryTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.deliveryTime)) {
    throw fail('Yetkazib berish vaqti noto‘g‘ri');
  }
  if (!['cash', 'payme', 'click'].includes(data.paymentMethod || 'cash')) throw fail('To‘lov usuli noto‘g‘ri');
  if (data.paymentMethod && data.paymentMethod !== 'cash' && !require('./payments').isEnabled(data.paymentMethod)) throw fail('Elektron to‘lov provayderi ulanmagan');
  if (data.specialRequests && (typeof data.specialRequests !== 'string' || data.specialRequests.length > 1000)) {
    throw fail('Izoh 1000 belgidan oshmasligi kerak');
  }
  const gift = policy.gift(data.gift);
  if (data.promoCode !== undefined && (typeof data.promoCode !== 'string' || !/^[a-z\d-]{0,30}$/i.test(data.promoCode))) throw fail('Promokod noto‘g‘ri');
  if (data.bonusUsed !== undefined && (!Number.isSafeInteger(data.bonusUsed) || data.bonusUsed < 0)) throw fail('Bonus miqdori noto‘g‘ri');
  return { items, date, configurations, gift };
}

async function createOrder(data, userId, duplicateAttempt = 0) {
  const { items, date, configurations, gift } = validateOrder(data);
  return transaction(async session => {
    if (data.idempotencyKey) {
      const previous = await Order.findOne({ user: userId, idempotencyKey: data.idempotencyKey }).session(session);
      if (previous) return previous;
    }
    const orderItems = [];
    let totalAmount = 0;
    for (const [itemKey, quantity] of items) {
      const productId = itemKey.split('#')[0];
      const product = await Product.findOneAndUpdate(
        { _id: productId, isAvailable: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity, soldCount: quantity } },
        { new: true, session }
      );
      if (!product) throw fail('Mahsulot mavjud emas yoki omborda yetarli miqdor yo‘q', 409);
      const config = configurations.get(itemKey);
      const price = policy.cakePrice(product, config);
      const total = price * quantity;
      if (!Number.isFinite(total) || total < 0) throw fail('Mahsulot narxi noto‘g‘ri', 409);
      totalAmount += total;
      orderItems.push({ product: product._id, name: product.name, quantity, price, total, ...(config ? { customization: config } : {}) });
    }
    const day = policy.dateKey(data.deliveryDate);
    if (!policy.slotsFor(day).includes(data.deliveryTime)) throw fail('Bu yetkazish vaqti mavjud emas. Boshqa vaqt tanlang', 409);
    if (configurations.size && new Date(`${day}T${data.deliveryTime}:00+05:00`).getTime() < Date.now() + 48 * 3600000) throw fail('Maxsus tort kamida 48 soat oldin buyurtma qilinadi');
    const slotKey = `${day}/${data.deliveryTime}`;
    const capacity = Math.max(1, Number(process.env.DELIVERY_SLOT_CAPACITY) || 5);
    const legacyCount = await Order.countDocuments({ slotKey: { $exists: false }, deliveryTime: data.deliveryTime, deliveryDate: { $gte: new Date(day), $lt: new Date(new Date(day).getTime() + 86400000) }, status: { $nin: ['cancelled', 'refunded'] } }).session(session);
    await Slot.updateOne({ _id: slotKey }, { $setOnInsert: { date: day, time: data.deliveryTime, count: 0 } }, { upsert: true, session });
    const reservation = await Slot.updateOne({ _id: slotKey, count: { $lt: capacity - legacyCount } }, { $inc: { count: 1 } }, { session });
    if (!reservation.modifiedCount) throw fail('Tanlangan vaqt band. Boshqa vaqt tanlang', 409);
    const deliveryFee = gift?.packaging === 'ribbon' ? 15000 : 0;
    let promoDiscount = 0;
    const promoCode = (data.promoCode || '').toUpperCase();
    if (promoCode) {
      const promo = await Promo.findOneAndUpdate({ code: promoCode, active: true, expiresAt: { $gt: new Date() }, minAmount: { $lte: totalAmount }, $expr: { $lt: ['$used', '$limit'] } }, { $inc: { used: 1 } }, { new: true, session });
      if (!promo) throw fail('Promokod yaroqsiz, tugagan yoki minimal summa yetarli emas');
      promoDiscount = Math.floor(totalAmount * promo.percent / 100);
    }
    const bonusUsed = data.bonusUsed || 0;
    if (bonusUsed > Math.floor((totalAmount - promoDiscount) * .2)) throw fail('Bonus bilan mahsulot summasining 20% gacha to‘lash mumkin');
    if (bonusUsed) {
      const debit = await User.updateOne({ _id: userId, bonusBalance: { $gte: bonusUsed } }, { $inc: { bonusBalance: -bonusUsed } }, { session });
      if (!debit.modifiedCount) throw fail('Bonus balansingiz yetarli emas', 409);
    }
    const discount = promoDiscount + bonusUsed;
    const [order] = await Order.create([{
      orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
      user: userId, idempotencyKey: data.idempotencyKey, items: orderItems, totalAmount, finalAmount: totalAmount + deliveryFee - discount,
      discount, promoCode, promoDiscount, bonusUsed, deliveryFee, gift, slotKey, deliveryAddress: data.deliveryAddress,
      deliveryDate: date, deliveryTime: data.deliveryTime, paymentMethod: data.paymentMethod || 'cash',
      specialRequests: data.specialRequests || '',
      statusHistory: [{ status: 'pending', note: 'Buyurtma qabul qilindi' }],
    }], { session });
    order.$locals = { ...order.$locals, checkoutCreated: true };
    return order;
  }).catch(async error => {
    if (error.code === 11000 && data.idempotencyKey) {
      const previous = await Order.findOne({ user: userId, idempotencyKey: data.idempotencyKey });
      if (previous) return previous;
    }
    if (error.code === 11000 && duplicateAttempt < 2) return createOrder(data, userId, duplicateAttempt + 1);
    throw error;
  });
}

async function changeOrder(id, changes, actor) {
  if (!isId(id)) throw fail('Buyurtma topilmadi', 404);
  return transaction(async session => {
    const order = await Order.findById(id).session(session);
    if (!order) throw fail('Buyurtma topilmadi', 404);
    const isAdmin = ['admin', 'superadmin'].includes(actor.role);
    if (!isAdmin && order.user.toString() !== actor.id) throw fail('Ruxsat berilmagan', 403);
    if (!isAdmin && (changes.status !== 'cancelled' || ['delivered', 'refunded'].includes(order.status))) {
      throw fail('Bu buyurtmani bekor qilib bo‘lmaydi', 409);
    }
    if (changes.status && changes.status !== order.status) {
      if (!transitions[order.status]?.includes(changes.status)) throw fail('Buyurtma holatini bunday o‘zgartirib bo‘lmaydi', 409);
      if (changes.status === 'cancelled') {
        if (order.paymentMethod !== 'cash' && order.paymentStatus === 'paid') throw fail('Avval to‘lov provayderida pulni qaytaring', 409);
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, soldCount: -item.quantity } }, { session });
        }
        await releaseBenefits(order, session);
      }
      order.status = changes.status;
      order.statusHistory.push({ status: changes.status, note: String(changes.note || 'Holat yangilandi').slice(0, 1000) });
      if (changes.status === 'delivered') {
        if (order.paymentMethod !== 'cash' && order.paymentStatus !== 'paid') throw fail('Buyurtma hali to‘lanmagan', 409);
        order.actualDeliveryTime = new Date();
        if (order.paymentMethod === 'cash') order.paymentStatus = 'paid';
        if (!order.bonusCredited) {
          order.bonusEarned = Math.floor((order.totalAmount - order.discount) * .03);
          await User.updateOne({ _id: order.user }, { $inc: { bonusBalance: order.bonusEarned } }, { session });
          order.bonusCredited = true;
        }
      }
      if (changes.status === 'refunded') {
        if (order.paymentMethod !== 'cash') throw fail('Elektron to‘lovni provayder qaytaradi', 409);
        await reverseBonus(order, session);
        order.paymentStatus = 'refunded';
      }
    }
    if (isAdmin) {
      if (['deliveryDate', 'deliveryTime'].some(key => changes[key] !== undefined && String(changes[key]) !== String(order[key]))) throw fail('Band qilingan yetkazish vaqtini o‘zgartirish uchun buyurtmani bekor qilib qayta yarating');
      for (const field of ['deliveryAddress', 'specialRequests']) {
        if (changes[field] !== undefined) order[field] = changes[field];
      }
      if (changes.discount !== undefined) {
        if (order.paymentMethod !== 'cash' || order.bonusUsed || order.promoCode || ['delivered', 'cancelled', 'refunded'].includes(order.status)) throw fail('Bu buyurtma chegirmasini o‘zgartirib bo‘lmaydi');
        const discount = Number(changes.discount);
        if (!Number.isFinite(discount) || discount < 0 || discount > order.totalAmount) throw fail('Chegirma noto‘g‘ri');
        order.discount = discount;
        order.finalAmount = order.totalAmount + order.deliveryFee - discount;
      }
      if (changes.paymentStatus !== undefined) {
        if (order.paymentMethod !== 'cash') throw fail('Elektron to‘lovni provayder tasdiqlashi kerak');
        order.paymentStatus = changes.paymentStatus;
      }
    }
    await order.save({ session });
    return order;
  });
}

async function releaseBenefits(order, session) {
  if (order.slotKey) await Slot.updateOne({ _id: order.slotKey, count: { $gt: 0 } }, { $inc: { count: -1 } }, { session });
  if (order.promoCode) await Promo.updateOne({ code: order.promoCode, used: { $gt: 0 } }, { $inc: { used: -1 } }, { session });
  if (order.bonusUsed) await User.updateOne({ _id: order.user }, { $inc: { bonusBalance: order.bonusUsed } }, { session });
}
async function reverseBonus(order, session) {
  if (order.bonusCredited && order.bonusEarned) {
    // A reversal is a debt if already-spent points exceed the current balance.
    await User.updateOne({ _id: order.user }, { $inc: { bonusBalance: -order.bonusEarned } }, { session });
    order.bonusCredited = false;
  }
  if (order.bonusUsed) await User.updateOne({ _id: order.user }, { $inc: { bonusBalance: order.bonusUsed } }, { session });
}
module.exports = { createOrder, changeOrder, validateOrder, transitions, isId, releaseBenefits, reverseBonus };
