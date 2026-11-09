const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    // ==================== VALIDATSIYA ====================

    // 1. Barcha maydonlar mavjudligini tekshirish
    if (![firstName, lastName, email, phone, password].every(value => typeof value === 'string' && value.trim())) {
      console.log('❌ Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Barcha maydonlarni to\'ldiring',
      });
    }

    // 2. Parol uzunligini tekshirish
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      console.log('❌ Password too short:', password?.length);
      return res.status(400).json({
        success: false,
        message: `Parol kamida 8 belgidan iborat bo'lishi kerak (hozir: ${password?.length} belgi)`,
      });
    }

    // 3. Parollar mosligini tekshirish
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      return res.status(400).json({
        success: false,
        message: 'Parollar mos emas',
      });
    }

    // 4. Email formatini tekshirish
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Email formati noto\'g\'ri',
      });
    }

    // 5. Telefon formatini tekshirish
    const phoneRegex = /^\+?998[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      console.log('❌ Invalid phone format:', phone);
      return res.status(400).json({
        success: false,
        message: 'Telefon raqam formati noto\'g\'ri (+998XXXXXXXXX)',
      });
    }

    // ==================== EMAIL BANDLIGI ====================

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Bu email allaqachon ro\'yxatdan o\'tgan',
      });
    }

    // ==================== USER YARATISH ====================

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      status: 'approved', // ✅ AVTOMATIK TASDIQLASH
      isActive: true,     // ✅ AVTOMATIK FAOLLASHTIRISH
    });

    console.log('✅ User created:', user._id);

    // ==================== TOKEN ====================

    const token = generateToken(user._id, user.tokenVersion);

    // Email yuborish (ixtiyoriy)
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.log('⚠️ Email yuborilmadi:', emailError.message);
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        token,
      },
      message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!',
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('❌ Error message:', error.message);

    // Mongoose validation xatoligi
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Duplicate key xatoligi
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu email allaqachon ro\'yxatdan o\'tgan',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validatsiya
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Iltimos email va parolni kiriting',
      });
    }

    // User topish
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Noto\'g\'ri email yoki parol',
      });
    }

    // Parolni tekshirish
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      console.log('❌ Wrong password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Noto\'g\'ri email yoki parol',
      });
    }

    // Aktivligini tekshirish
    if (!user.isActive) {
      console.log('❌ User is not active:', email);
      return res.status(403).json({
        success: false,
        message: 'Akkauntingiz bloklangan',
      });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Akkauntingiz hali tasdiqlanmagan' });
    }
    // ==================== STATUS TEKSHIRUVI OLIB TASHLANDI ====================
    // Endi status qanday bo'lishidan qat'i nazar login qilish mumkin
    // if (user.status !== 'approved') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Akkauntingiz hali tasdiqlanmagan',
    //   });
    // }

    // Last login
    user.lastLogin = new Date();
    await user.save();

    // Token
    const token = generateToken(user._id, user.tokenVersion);

    console.log('✅ Login successful:', email);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        address: user.address,
        status: user.status,
        token,
      },
      message: 'Tizimga muvaffaqiyatli kirdingiz!',
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('wishlist')
      .populate({
        path: 'cart.product',
        select: 'name price images',
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profil muvaffaqiyatli yangilandi',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ success: false, message: 'Joriy parolni kiriting' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({
        success: false,
        message: 'Yangi parol kamida 8 belgidan iborat bo\'lishi kerak',
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.status(200).json({
      success: true,
      token,
      message: 'Parol muvaffaqiyatli o\'zgartirildi',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Serverda xatolik yuz berdi',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};
