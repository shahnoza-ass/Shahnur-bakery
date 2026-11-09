const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImagesOnly,
  uploadProductImages,
  deleteProductImage,
  updateStock,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/productUpload');
const validateProduct = require('../middleware/validateProduct');

// MUHIM: /upload-images /:id dan OLDIN bo'lishi kerak
router.post(
  '/upload-images',
  protect,
  admin,
  uploadMultiple('images', 5),
  uploadProductImagesOnly
);

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, admin, validateProduct, createProduct);
router.put('/:id', protect, admin, validateProduct, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.patch('/:id/stock', protect, admin, updateStock);
router.post(
  '/:id/images',
  protect,
  admin,
  uploadMultiple('images', 5),
  uploadProductImages
);
router.delete('/:id/images/:imageId', protect, admin, deleteProductImage);

module.exports = router;
