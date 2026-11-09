const router = require('express').Router();
const { protect, admin } = require('../middleware/auth');
const { Promo, Slot } = require('../models/Commerce');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const policy = require('../services/commercePolicy');
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (e) { res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Amalni bajarib bo‘lmadi' }); } };
router.get('/config', (_req, res) => res.json({ data: { cakeOptions: policy.cakeOptions, allergens: policy.allergens, giftPackagingFee: 15000, bonusRate: 3, bonusMaxPercent: 20, customLeadHours: 48, payments: require('../services/payments').methods() } }));
router.get('/slots', wrap(async (req, res) => {
  const date = policy.dateKey(req.query.date);
  const times = policy.slotsFor(date);
  const counts = await Slot.find({ date }).lean();
  const legacy = await Order.aggregate([{ $match: { slotKey: { $exists: false }, deliveryDate: { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 86400000) }, status: { $nin: ['cancelled', 'refunded'] } } }, { $group: { _id: '$deliveryTime', count: { $sum: 1 } } }]);
  const capacity = Math.max(1, Number(process.env.DELIVERY_SLOT_CAPACITY) || 5);
  res.json({ data: times.map(time => ({ time, remaining: Math.max(0, capacity - (counts.find(s => s.time === time)?.count || 0) - (legacy.find(s => s._id === time)?.count || 0)) })) });
}));
router.post('/cake-quote', wrap(async (req, res) => {
  const { isId } = require('../services/orderWorkflow');
  if (!isId(req.body.product)) throw policy.fail('Mahsulot noto‘g‘ri');
  const product = await Product.findOne({ _id: req.body.product, isAvailable: true });
  if (!product) throw policy.fail('Mahsulot topilmadi', 404);
  const config = policy.customization(req.body.customization);
  if (!config) throw policy.fail('Tort tanlovlarini kiriting');
  res.json({ data: { customization: config, price: policy.cakePrice(product, config) } });
}));
router.get('/loyalty', protect, wrap(async (req, res) => {
  const user = await User.findById(req.user.id).select('bonusBalance');
  const orders = await Order.find({ user: req.user.id, $or: [{ bonusUsed: { $gt: 0 } }, { bonusEarned: { $gt: 0 } }] }).sort({ createdAt: -1 }).limit(30).select('orderNumber bonusUsed bonusEarned bonusCredited status createdAt');
  res.json({ data: { balance: user.bonusBalance || 0, orders } });
}));
router.post('/promo-check', protect, wrap(async (req, res) => {
  if (typeof req.body.code !== 'string' || !/^[a-z\d-]{1,30}$/i.test(req.body.code)) throw policy.fail('Promokod noto‘g‘ri');
  const promo = await Promo.findOne({ code: req.body.code.toUpperCase(), active: true, expiresAt: { $gt: new Date() }, $expr: { $lt: ['$used', '$limit'] } });
  if (!promo) throw policy.fail('Promokod yaroqsiz yoki tugagan');
  res.json({ data: { code: promo.code, percent: promo.percent, minAmount: promo.minAmount } });
}));
router.get('/admin/promos', protect, admin, wrap(async (_req, res) => res.json({ data: await Promo.find().sort({ createdAt: -1 }).limit(100) })));
router.post('/admin/promos', protect, admin, wrap(async (req, res) => {
  const b = req.body;
  if (typeof b.code !== 'string' || !/^[a-z\d-]{1,30}$/i.test(b.code) || !Number.isInteger(b.percent) || b.percent < 1 || b.percent > 50 || !Number.isSafeInteger(b.limit) || b.limit < 1 || !Number.isSafeInteger(b.minAmount) || b.minAmount < 0 || !(new Date(b.expiresAt) > new Date())) throw policy.fail('Promokod maydonlarini tekshiring');
  try { res.status(201).json({ data: await Promo.create({ code: b.code.toUpperCase(), percent: b.percent, limit: b.limit, minAmount: b.minAmount, expiresAt: b.expiresAt }) }); }
  catch (e) { if (e.code === 11000) throw policy.fail('Bu promokod mavjud', 409); throw e; }
}));
router.patch('/admin/promos/:id', protect, admin, wrap(async (req, res) => {
  if (!require('../services/orderWorkflow').isId(req.params.id) || typeof req.body.active !== 'boolean') throw policy.fail('So‘rov noto‘g‘ri');
  const promo = await Promo.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });
  if (!promo) throw policy.fail('Promokod topilmadi', 404);
  res.json({ data: promo });
}));
router.get('/admin/insights', protect, admin, wrap(async (req, res) => {
  const from = policy.dateKey(req.query.from), to = policy.dateKey(req.query.to);
  if (from > to || new Date(to) - new Date(from) > 92 * 86400000) throw policy.fail('Hisobot davri 93 kundan oshmasin');
  const start = new Date(`${from}T00:00:00+05:00`), end = new Date(new Date(`${to}T00:00:00+05:00`).getTime() + 86400000);
  const [daily, lowStock, calendar] = await Promise.all([
    Order.aggregate([{ $match: { status: 'delivered', paymentStatus: 'paid', actualDeliveryTime: { $gte: start, $lt: end } } }, { $group: { _id: { $dateToString: { date: '$actualDeliveryTime', format: '%Y-%m-%d', timezone: 'Asia/Tashkent' } }, revenue: { $sum: '$finalAmount' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Product.find({ isAvailable: true, $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 5] }] } }).select('name stock lowStockThreshold').sort({ stock: 1 }).limit(100),
    Order.find({ deliveryDate: { $gte: new Date(from), $lt: new Date(new Date(to).getTime() + 86400000) }, status: { $nin: ['cancelled', 'refunded'] } }).select('orderNumber deliveryDate deliveryTime status finalAmount gift items').sort({ deliveryDate: 1, deliveryTime: 1 }).limit(1000),
  ]);
  res.json({ data: { daily, lowStock, calendar, calendarLimit: 1000, timezone: 'Asia/Tashkent' } });
}));
module.exports = router;
