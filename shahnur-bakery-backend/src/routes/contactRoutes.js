const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ContactMessage = require('../models/ContactMessage');
const { protect, admin } = require('../middleware/auth');
const { isId } = require('../services/orderWorkflow');
router.post('/', rateLimit({ windowMs: 3600000, max: 10 }), async (req, res) => {
  const { name, email, message } = req.body;
  if (![name, email, message].every(value => typeof value === 'string' && value.trim()) || name.length > 100 || email.length > 254 || message.length > 5000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Ism, email va xabarni to‘g‘ri kiriting' });
  }
  try {
    await ContactMessage.create({ name, email, message });
    res.status(201).json({ success: true, message: 'Xabaringiz qabul qilindi' });
  } catch { res.status(500).json({ success: false, message: 'Xabar saqlanmadi' }); }
});
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const data = await ContactMessage.find().sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50);
    const total = await ContactMessage.countDocuments();
    res.json({ success: true, data, pagination: { page, total, pages: Math.ceil(total / 50) } });
  } catch { res.status(500).json({ success: false, message: 'Xabarlarni yuklab bo‘lmadi' }); }
});
router.patch('/:id/read', protect, admin, async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ success: false });
  try {
    const data = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!data) return res.status(404).json({ success: false });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'Xabar yangilanmadi' }); }
});
module.exports = router;
