const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Random token yaratish
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Unique ID yaratish
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Slug yaratish
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Sonni formatlash (O'zbekiston so'mi)
const formatCurrency = (amount, currency = 'UZS') => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Sanani formatlash
const formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  if (format === 'full') {
    return d.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  if (format === 'date') {
    return d.toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return d.toISOString();
};

// Vaqt farqini hisoblash
const getTimeDifference = (date1, date2) => {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} kun`;
  if (hours > 0) return `${hours} soat`;
  if (minutes > 0) return `${minutes} daqiqa`;
  return 'Hozirgina';
};

// Valid phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?998[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Valid email
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Xatolarni log qilish
const logError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `
[${timestamp}] ${context}
Error: ${error.message}
Stack: ${error.stack}
---
`;
  
  // Faylga yozish
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage);
  
  // Konsolga chiqarish
  console.error(logMessage);
};

// IP manzilni olish
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         'unknown';
};

// Brauzer ma'lumotlarini olish
const getUserAgent = (req) => {
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Mobile/i.test(ua);
  const isTablet = /Tablet/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  return {
    userAgent: ua,
    isMobile,
    isTablet,
    isDesktop,
    browser,
  };
};

// Object'dan null va undefined qiymatlarni olib tashlash
const cleanObject = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleaned = cleanObject(value);
        if (Object.keys(cleaned).length > 0) {
          result[key] = cleaned;
        }
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

// Pagination parametrlarini olish
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

// Sort parametrlarini olish
const getSortParams = (query, defaultSort = '-createdAt') => {
  const sort = query.sort || defaultSort;
  const sortFields = sort.split(',');
  const sortObject = {};
  
  sortFields.forEach(field => {
    if (field.startsWith('-')) {
      sortObject[field.substring(1)] = -1;
    } else {
      sortObject[field] = 1;
    }
  });
  
  return sortObject;
};

// Filter parametrlarini olish
const getFilterParams = (query, allowedFields) => {
  const filters = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (allowedFields.includes(key) && value !== undefined && value !== '') {
      if (key === 'search') {
        filters.$or = [
          { name: { $regex: value, $options: 'i' } },
          { description: { $regex: value, $options: 'i' } },
        ];
      } else if (key === 'minPrice' || key === 'maxPrice') {
        if (!filters.price) filters.price = {};
        if (key === 'minPrice') filters.price.$gte = Number(value);
        if (key === 'maxPrice') filters.price.$lte = Number(value);
      } else if (key === 'isAvailable') {
        filters.isAvailable = value === 'true';
      } else if (key === 'category') {
        filters.category = value;
      } else {
        filters[key] = value;
      }
    }
  }
  
  return filters;
};

// Foydalanuvchi uchun xavfsiz ma'lumotlarni qaytarish
const sanitizeUser = (user) => {
  const { password, resetPasswordToken, resetPasswordExpire, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
};

module.exports = {
  generateToken,
  generateUniqueId,
  createSlug,
  formatCurrency,
  formatDate,
  getTimeDifference,
  isValidPhone,
  isValidEmail,
  logError,
  getClientIP,
  getUserAgent,
  cleanObject,
  getPaginationParams,
  getSortParams,
  getFilterParams,
  sanitizeUser,
};