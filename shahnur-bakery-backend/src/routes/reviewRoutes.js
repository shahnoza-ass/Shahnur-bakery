const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  respondToReview,
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/product/:productId', getProductReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/respond', protect, admin, respondToReview);

module.exports = router;
