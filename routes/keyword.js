const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keyword');
const middleware = require('../middlewares/admin-middleware');

router
  .post('/admin-keywords/:p_No', middleware, keywordController.createKeyword) // 키워드 등록
  .get('/admin-keywords/:p_No', middleware, keywordController.getKeywords) // 상품 선택 후 조회
  .put('/admin-keywords/:p_No', middleware, keywordController.updateKeyword) // 키워드 수정
  .delete('/admin-keywords/:p_No', middleware, keywordController.deleteKeywords) // 키워드 삭제
  .get('/ad-keyword', middleware, keywordController.getKeywordCost); // 예상 순위 및 입찰 금액

module.exports = router;
