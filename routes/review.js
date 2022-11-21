const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');
const middleware = require('../middlewares/client-middleware');

router
  .post('/:p_No', middleware, reviewController.createReview) // 구매평 작성
  .get('/:p_No', middleware, reviewController.getReviews) // 구매평 조회
  .put('/:r_No', middleware, reviewController.updateReview) // 구매평 수정
  .delete('/:r_No', middleware, reviewController.deleteReview); // 구매평 삭제

module.exports = router;
