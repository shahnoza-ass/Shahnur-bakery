const { timingSafeEqual, createHash } = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { Payment, Counter } = require('../models/Commerce');
const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
function isEnabled(method) {
  if (method === 'cash') return true;
  const keys = method === 'payme' ? ['PAYME_MERCHANT_ID', 'PAYME_SECRET_KEY'] : method === 'click' ? ['CLICK_MERCHANT_ID', 'CLICK_SERVICE_ID', 'CLICK_SECRET_KEY'] : [];
  return keys.length > 0 && process.env.PAYMENTS_ENABLED === 'true' && keys.every(key => !!process.env[key]);
}
const methods = () => ['cash', 'payme', 'click'].filter(isEnabled);
const rpcError = (code, text, data) => ({ error: { code, message: { uz: text, ru: text, en: text }, ...(data ? { data } : {}) } });
function checkoutUrl(order) {
  if (!isEnabled(order.paymentMethod)) throw Object.assign(new Error('To‘lov usuli ulanmagan'), { status: 503 });
  const returnUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0] + '/my-orders';
  if (order.paymentMethod === 'payme') {
    const payload = `m=${process.env.PAYME_MERCHANT_ID};ac.order_id=${order.id};a=${Math.round(order.finalAmount * 100)};c=${returnUrl}`;
    return `https://${process.env.PAYME_TEST_MODE === 'true' ? 'test.paycom.uz' : 'checkout.paycom.uz'}/${Buffer.from(payload).toString('base64')}`;
  }
  if (order.paymentMethod === 'click') return 'https://my.click.uz/services/pay?' + new URLSearchParams({ service_id: process.env.CLICK_SERVICE_ID, merchant_id: process.env.CLICK_MERCHANT_ID, amount: String(order.finalAmount), transaction_param: order.id, return_url: returnUrl });
  return null;
}
async function transaction(fn) {
  for (let attempt = 0; ; attempt++) {
    try { let result; await mongoose.connection.transaction(async session => { result = await fn(session); }); return result; }
    catch (e) { if (e.code !== 11000 || attempt >= 2) throw e; }
  }
}
const resultFor = p => ({ transaction: p.id, create_time: p.createTime, perform_time: p.performTime, cancel_time: p.cancelTime, state: p.state, reason: p.reason ?? null });
async function payable(id, provider, session) {
  if (!/^[a-f\d]{24}$/i.test(String(id))) return null;
  return Order.findOne({ _id: id, paymentMethod: provider, paymentStatus: { $in: ['pending', 'failed'] }, status: { $nin: ['cancelled', 'delivered', 'refunded'] } }).session(session);
}
async function cancelReserved(order, session, refunded) {
  if (!['cancelled', 'refunded'].includes(order.status)) {
    for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, soldCount: -item.quantity } }, { session });
    await require('./orderWorkflow').releaseBenefits(order, session);
    order.status = refunded ? 'refunded' : 'cancelled';
    order.statusHistory.push({ status: order.status, note: 'To‘lov provayderi tomonidan bekor qilindi' });
  }
  order.paymentStatus = refunded ? 'refunded' : 'failed';
  order.activePayment = undefined;
  await order.save({ session });
}
async function payme(body, authorization) {
  if (!isEnabled('payme') || !safeEqual(authorization, 'Basic ' + Buffer.from('Paycom:' + process.env.PAYME_SECRET_KEY).toString('base64'))) return rpcError(-32504, 'Ruxsat berilmagan');
  const p = body.params || {};
  if (body.method === 'GetStatement') {
    if (!Number.isSafeInteger(p.from) || !Number.isSafeInteger(p.to) || p.from > p.to || p.to - p.from > 31 * 86400000) return rpcError(-32602, 'Davr noto‘g‘ri');
    const rows = await Payment.find({ provider: 'payme', providerTime: { $gte: p.from, $lte: p.to } }).sort({ providerTime: 1 }).limit(10000);
    return { result: { transactions: rows.map(t => ({ id: t.externalId, time: t.providerTime, amount: t.amount, account: { order_id: String(t.order) }, ...resultFor(t) })) } };
  }
  if (!['CheckPerformTransaction', 'CreateTransaction', 'PerformTransaction', 'CancelTransaction', 'CheckTransaction'].includes(body.method)) return rpcError(-32601, 'Metod topilmadi');
  return transaction(async session => {
    if (['CheckPerformTransaction', 'CreateTransaction'].includes(body.method)) {
      const order = await payable(p.account?.order_id, 'payme', session);
      if (body.method === 'CreateTransaction') {
        if (typeof p.id !== 'string' || p.id.length > 100 || !Number.isSafeInteger(p.time) || p.time < 1) return rpcError(-32602, 'Parametrlar noto‘g‘ri');
        const existing = await Payment.findOne({ provider: 'payme', externalId: p.id }).session(session);
        if (existing) {
          if (String(existing.order) !== String(p.account?.order_id) || existing.amount !== p.amount) return rpcError(-31001, 'Summa mos emas');
          if (existing.state !== 1) return rpcError(-31008, 'Tranzaksiya holati mos emas');
          if (Date.now() - existing.providerTime > 43200000) {
            existing.state = -1; existing.reason = 4; existing.cancelTime = Date.now(); await existing.save({ session });
            const reserved = await Order.findById(existing.order).session(session); if (reserved) await cancelReserved(reserved, session, false);
            return rpcError(-31008, 'Tranzaksiya muddati tugagan');
          }
          return { result: resultFor(existing) };
        }
      }
      if (!order) return rpcError(-31050, 'Buyurtma topilmadi yoki to‘lab bo‘lmaydi', 'order_id');
      if (!Number.isSafeInteger(p.amount) || p.amount !== Math.round(order.finalAmount * 100)) return rpcError(-31001, 'Summa mos emas');
      if (order.activePayment) return rpcError(-31008, 'Buyurtmada boshqa faol tranzaksiya mavjud');
      if (body.method === 'CheckPerformTransaction') return { result: { allow: true } };
      if (Date.now() - p.time > 43200000 || p.time > Date.now() + 60000) return rpcError(-31008, 'Tranzaksiya muddati noto‘g‘ri');
      order.activePayment = p.id; await order.save({ session });
      const [payment] = await Payment.create([{ provider: 'payme', externalId: p.id, order: order._id, amount: p.amount, providerTime: p.time, createTime: Date.now() }], { session });
      return { result: resultFor(payment) };
    }
    if (typeof p.id !== 'string') return rpcError(-32602, 'Parametr noto‘g‘ri');
    const payment = await Payment.findOne({ provider: 'payme', externalId: p.id }).session(session);
    if (!payment) return rpcError(-31003, 'Tranzaksiya topilmadi');
    if (body.method === 'CheckTransaction') return { result: resultFor(payment) };
    const order = await Order.findById(payment.order).session(session);
    if (!order) return rpcError(-31050, 'Buyurtma topilmadi', 'order_id');
    if (body.method === 'PerformTransaction') {
      if (payment.state === 2) return { result: resultFor(payment) };
      if (payment.state !== 1 || ['cancelled', 'refunded'].includes(order.status)) return rpcError(-31008, 'Tranzaksiyani yakunlab bo‘lmaydi');
      if (Date.now() - payment.providerTime > 43200000) { payment.state = -1; payment.reason = 4; payment.cancelTime = Date.now(); await payment.save({ session }); await cancelReserved(order, session, false); return rpcError(-31008, 'Tranzaksiya muddati tugagan'); }
      payment.state = 2; payment.performTime = Date.now(); order.paymentStatus = 'paid';
    } else {
      if (!Number.isInteger(p.reason) || p.reason < 1 || p.reason > 10) return rpcError(-32602, 'Sabab noto‘g‘ri');
      if (payment.state < 0) return { result: resultFor(payment) };
      if (order.status === 'delivered') return rpcError(-31007, 'Buyurtma yetkazilgan');
      const refunded = payment.state === 2;
      payment.state = refunded ? -2 : -1; payment.reason = p.reason; payment.cancelTime = Date.now();
      await cancelReserved(order, session, refunded);
    }
    await payment.save({ session }); await order.save({ session });
    return { result: resultFor(payment) };
  });
}
function clickSignature(p) {
  const raw = String(p.click_trans_id) + p.service_id + process.env.CLICK_SECRET_KEY + p.merchant_trans_id + (String(p.action) === '1' ? p.merchant_prepare_id : '') + p.amount + p.action + p.sign_time;
  return createHash('md5').update(raw).digest('hex');
}
async function click(p, action) {
  const reply = (error, error_note, extra = {}) => ({ click_trans_id: p.click_trans_id, merchant_trans_id: p.merchant_trans_id, error, error_note, ...extra });
  if (!isEnabled('click') || String(p.service_id) !== process.env.CLICK_SERVICE_ID || !safeEqual(p.sign_string, clickSignature(p))) return reply(-1, 'SIGN CHECK FAILED');
  if (String(p.action) !== String(action)) return reply(-3, 'Action not found');
  if (!/^\d{1,30}$/.test(String(p.click_trans_id)) || !/^\d+(\.\d{1,2})?$/.test(String(p.amount)) || !Number.isFinite(Number(p.error))) return reply(-8, 'Invalid parameters');
  return transaction(async session => {
    let payment = await Payment.findOne({ provider: 'click', externalId: String(p.click_trans_id) }).session(session);
    if (payment && (String(payment.order) !== p.merchant_trans_id || payment.amount !== Math.round(Number(p.amount) * 100))) return reply(-2, 'Incorrect amount or order');
    if (action === 0) {
      if (payment) return payment.state < 0 ? reply(-9, 'Transaction cancelled') : payment.state === 2 ? reply(-4, 'Already paid') : reply(0, 'Success', { merchant_prepare_id: payment.prepareId });
      const order = await payable(p.merchant_trans_id, 'click', session);
      if (!order) return reply(-5, 'Order not found or not payable');
      if (Math.round(Number(p.amount) * 100) !== Math.round(order.finalAmount * 100)) return reply(-2, 'Incorrect amount');
      if (order.activePayment || Number(p.error) < 0) return reply(-9, 'Transaction cancelled or busy');
      const counter = await Counter.findOneAndUpdate({ _id: 'click' }, { $inc: { value: 1 } }, { upsert: true, new: true, session });
      order.activePayment = String(p.click_trans_id); await order.save({ session });
      [payment] = await Payment.create([{ provider: 'click', externalId: String(p.click_trans_id), order: order._id, amount: Math.round(Number(p.amount) * 100), createTime: Date.now(), prepareId: counter.value }], { session });
      return reply(0, 'Success', { merchant_prepare_id: payment.prepareId });
    }
    if (!payment || String(payment.prepareId) !== String(p.merchant_prepare_id)) return reply(-6, 'Transaction not found');
    if (payment.state === 2) return reply(-4, 'Already paid', { merchant_confirm_id: payment.prepareId });
    if (payment.state < 0) return reply(-9, 'Transaction cancelled');
    const order = await Order.findById(payment.order).session(session);
    if (!order) return reply(-5, 'Order not found');
    if (Number(p.error) < 0 || ['cancelled', 'refunded'].includes(order.status)) {
      payment.state = -1; payment.cancelTime = Date.now(); await payment.save({ session }); await cancelReserved(order, session, false); return reply(-9, 'Transaction cancelled');
    }
    payment.state = 2; payment.performTime = Date.now(); order.paymentStatus = 'paid';
    await payment.save({ session }); await order.save({ session });
    return reply(0, 'Success', { merchant_confirm_id: payment.prepareId });
  });
}
module.exports = { isEnabled, methods, checkoutUrl, payme, click, clickSignature, safeEqual };
