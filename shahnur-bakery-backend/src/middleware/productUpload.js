const multer = require('multer');
const { imageType, storeImage, removeStoredImage } = require('../services/productMedia');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 10, parts: 15 } });
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, async error => {
    if (error) return next(Object.assign(new Error(error.code === 'LIMIT_FILE_SIZE' ? 'Har bir rasm 5 MB dan oshmasin.' : 'Bir martada 5 tagacha rasm yuklang.'), { statusCode: error.code === 'LIMIT_FILE_SIZE' ? 413 : 400 }));
    const files = req.files || [];
    if (files.some(file => !imageType(file.buffer))) return next(Object.assign(new Error('Faqat JPG, PNG, WEBP yoki GIF rasm yuklang. HEIC rasmini JPG formatiga o‘tkazing.'), { statusCode: 400 }));
    const saved = [];
    try {
      for (const file of files) { const stored = await storeImage(file); saved.push(stored); Object.assign(file, stored); delete file.buffer; }
      next();
    } catch {
      await Promise.allSettled(saved.map(removeStoredImage));
      next(Object.assign(new Error('Rasmlarni saqlab bo‘lmadi. Qayta urinib ko‘ring.'), { statusCode: 503 }));
    }
  });
};
module.exports = { uploadMultiple };
