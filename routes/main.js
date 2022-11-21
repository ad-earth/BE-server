const express = require('express');
const router = express.Router();
const clientMainController = require('../controllers/main');

router
  .get('/', clientMainController.getMainProducts) // 구매자 메인화면
  .get('/search', clientMainController.getSearchProducts) // 검색 상품 조회
  .get('/products/:p_Category', clientMainController.getCategoryProducts); // 카테고리별 상품 조회

module.exports = router;
