const router = require('express').Router();
const { protect } = require('../middleware/auth');
const payments = require('../services/payments');
const Order = require('../models/Order');
router.get('/:id/checkout', protect, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).json({ message: 'Buyurtma topilmadi' });
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Buyurtma topilmadi' });
    if (order.paymentStatus === 'paid' || ['cancelled', 'refunded', 'delivered'].includes(order.status)) return res.status(409).json({ message: 'Bu buyurtmani to‘lab bo‘lmaydi' });
    res.json({ data: { url: payments.checkoutUrl(order) } });
  } catch (e) { res.status(e.status || 500).json({ message: e.status ? e.message : 'To‘lov havolasi yaratilmagan' }); }
});
router.post('/payme', async (req, res) => {
  try { res.json({ jsonrpc: '2.0', id: req.body.id ?? null, ...await payments.payme(req.body, req.headers.authorization) }); }
  catch { res.json({ jsonrpc: '2.0', id: req.body.id ?? null, error: { code: -32400, message: { uz: 'Server xatosi', ru: 'Ошибка сервера', en: 'Server error' } } }); }
});
for (const [route, action] of [['prepare', 0], ['complete', 1]]) router.post('/click/' + route, async (req, res) => {
  try { res.json(await payments.click(req.body, action)); }
  catch { res.json({ error: -7, error_note: 'Failed to update transaction' }); }
});
module.exports = router;
