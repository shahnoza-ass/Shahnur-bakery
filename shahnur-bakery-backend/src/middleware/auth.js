const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Tokenni olish
      token = req.headers.authorization.split(' ')[1];

      // Tokenni verify qilish
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Userni topish (parolni qo'shmaymiz)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Foydalanuvchi topilmadi',
        });
      }

      if ((decoded.version || 0) !== (req.user.tokenVersion || 0)) {
        return res.status(401).json({ success: false, message: 'Qayta tizimga kiring' });
      }
      if (req.user.passwordChangedAt && decoded.iat < Math.floor(req.user.passwordChangedAt.getTime() / 1000)) {
        return res.status(401).json({ success: false, message: 'Qayta tizimga kiring' });
      }
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Sizning akkauntingiz bloklangan',
        });
      }

      if (req.user.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Akkauntingiz hali tasdiqlanmagan',
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Ruxsat berilmagan, token noto\'g\'ri',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Ruxsat berilmagan, token topilmadi',
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && ['admin', 'superadmin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin ruxsati talab qilinadi',
    });
  }
};

const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Super admin ruxsati talab qilinadi',
    });
  }
};

module.exports = { protect, admin, superAdmin };