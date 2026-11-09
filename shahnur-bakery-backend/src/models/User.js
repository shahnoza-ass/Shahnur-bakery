const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Iltimos ismingizni kiriting'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Iltimos familyangizni kiriting'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Iltimos email manzilingizni kiriting'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Iltimos haqiqiy email manzil kiriting',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Iltimos telefon raqamingizni kiriting'],
    },
    password: {
      type: String,
      required: [true, 'Iltimos parol kiriting'],
      minlength: 8,
      maxlength: 72,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    profileImage: {
      type: String,
      default: 'default-profile.jpg',
    },
    address: {
      street: String,
      city: String,
      district: String,
      zipCode: String,
      country: { type: String, default: 'Uzbekistan' },
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        customNote: String,
      },
    ],
    tokenVersion: { type: Number, default: 0, select: true },
    bonusBalance: { type: Number, default: 0 },
    passwordChangedAt: Date,
    lastLogin: Date,
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
  }
);

// Parolni hash qilish
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Parolni tekshirish metodi
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// To'liq ismni olish
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
