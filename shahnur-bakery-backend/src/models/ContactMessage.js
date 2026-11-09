const mongoose = require('mongoose');
module.exports = mongoose.model('ContactMessage', new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  isRead: { type: Boolean, default: false },
}, { timestamps: true }));
