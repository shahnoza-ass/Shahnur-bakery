const router = require('express').Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');
const recoveryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
router.post('/forgot-password', recoveryLimiter, async (req, res) => {
  const email = req.body.email;
  if (typeof email !== 'string' || email.length > 254) return res.status(400).json({ success: false, message: 'Email noto‘g‘ri' });
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase(), isActive: true });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const sent = await sendPasswordResetEmail(user.email, user.firstName, token);
      if (!sent) console.error('Password reset email delivery failed');
    }
    res.json({ success: true, message: 'Email ro‘yxatda bo‘lsa, tiklash havolasi yuboriladi. Spam papkasini ham tekshiring.' });
  } catch { res.status(503).json({ success: false, message: 'Tiklash xizmati hozircha mavjud emas' }); }
});
router.post('/reset-password/:token', recoveryLimiter, async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!/^[a-f\d]{64}$/i.test(req.params.token) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 || password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Parollar mos bo‘lsin va 8–72 belgidan iborat bo‘lsin' });
  }
  try {
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    // Claim the reset token atomically so concurrent requests cannot reuse it.
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate({ resetPasswordToken: token, resetPasswordExpire: { $gt: new Date() } }, {
      $set: { password: hash, passwordChangedAt: new Date() },
      $inc: { tokenVersion: 1 }, $unset: { resetPasswordToken: '', resetPasswordExpire: '' },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Havola eskirgan yoki allaqachon ishlatilgan' });
    res.json({ success: true, message: 'Parol yangilandi. Tizimga qayta kiring.' });
  } catch { res.status(500).json({ success: false, message: 'Parolni yangilab bo‘lmadi' }); }
});
module.exports = router;
